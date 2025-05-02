import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

// Rutas públicas que no requieren autenticación (paths exactos o prefijos)
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/",
  "/access-denied",
  "/_next",
  "/favicon.ico",
];

// Lista específica de rutas protegidas y sus permisos
const protectedRoutes = {
  "/api/auth/*": "auth",
  "/dashboard": "dashboard",
  "/leads": "leads",
  "/ventas": "sales",
  "/reportes": "reports",
  "/tareas": "tasks",
  "/users": "users",
  "/admin": "admin",
  "/admin/roles": "admin.roles",
};

// Función para comprobar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  // Caso especial para la ruta raíz
  if (pathname === "/") {
    return true;
  }

  return publicRoutes.some((route) => {
    // No usar la ruta raíz "/" para comparaciones con startsWith
    if (route === "/") {
      return false;
    }
    return pathname === route || pathname.startsWith(route);
  });
}

// Función para obtener el permiso requerido para una ruta
function getRequiredPermission(pathname: string): string | null {
  console.log(`[MIDDLEWARE] Checking permission for path: ${pathname}`);

  // Primero intentamos una coincidencia exacta
  if (protectedRoutes[pathname]) {
    console.log(`[MIDDLEWARE] Exact match found: ${protectedRoutes[pathname]}`);
    return protectedRoutes[pathname];
  }

  // Si no hay coincidencia exacta, buscamos el prefijo más largo que coincida
  let matchedRoute = "";
  let matchedPermission = null;

  for (const route in protectedRoutes) {
    if (pathname.startsWith(route) && route.length > matchedRoute.length) {
      matchedRoute = route;
      matchedPermission = protectedRoutes[route];
      console.log(
        `[MIDDLEWARE] Found matching prefix: ${route} -> ${matchedPermission}`
      );
    }
  }

  return matchedPermission;
}

// Agregar una función auxiliar para verificar permisos en estructuras anidadas
function checkPermission(permissions: any, permissionKey: string): boolean {
  // Si es un permiso simple (no anidado)
  if (!permissionKey.includes(".")) {
    return permissions.sections?.[permissionKey]?.view === true;
  }

  // Para permisos anidados como 'admin.roles'
  const [parent, child] = permissionKey.split(".");

  // Verificar si existe la estructura anidada correcta
  if (permissions.sections?.[parent]?.[child]?.view === true) {
    console.log(`[MIDDLEWARE] Found nested permission ${parent}.${child}`);
    return true;
  }

  // Si no existe la estructura anidada, verificar si el padre tiene permisos
  if (permissions.sections?.[parent]?.view === true) {
    console.log(`[MIDDLEWARE] Found parent permission ${parent}`);
    return true;
  }

  // Mostrar todas las rutas y permisos disponibles para ayudar con el debug
  console.log(`[MIDDLEWARE] Permission check details for ${permissionKey}:`);
  console.log(`  - Parent key: ${parent}`);
  console.log(`  - Child key: ${child}`);
  console.log(`  - Parent exists: ${Boolean(permissions.sections?.[parent])}`);

  if (permissions.sections?.[parent]) {
    console.log(`  - Parent keys:`, Object.keys(permissions.sections[parent]));
  }

  // Listar todas las secciones y permisos disponibles para el usuario
  console.log(`[MIDDLEWARE] All available permissions:`);
  Object.keys(permissions.sections || {}).forEach((section) => {
    console.log(`  - ${section}:`, permissions.sections[section]);
  });

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] Path: ${pathname}`);

  // Ignorar completamente todas las rutas de API
  if (pathname.startsWith("/api/")) {
    console.log(`[MIDDLEWARE] Skipping API route: ${pathname}`);
    return NextResponse.next();
  }

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute(pathname)) {
    console.log(`[MIDDLEWARE] Public route: ${pathname}, allowing access`);
    return NextResponse.next();
  }

  // Crear respuesta y cliente de Supabase
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Si no hay sesión, redirigir a login
    if (!session?.user) {
      console.log(`[MIDDLEWARE] No session, redirecting to sign-in`);
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    console.log(`[MIDDLEWARE] Session found for user: ${session.user.id}`);

    // Obtener los permisos del usuario utilizando el endpoint API en lugar de acceder directo a Supabase
    // Construir la URL completa para el fetch
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/users/${session.user.id}?requireAuth=false`;

    console.log(`[MIDDLEWARE] Fetching user data from API: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!apiResponse.ok) {
      console.error(`[MIDDLEWARE] API returned error ${apiResponse.status}`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    const { profile } = await apiResponse.json();

    if (!profile || !profile.permissions) {
      console.error(`[MIDDLEWARE] No user profile or permissions found`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    console.log(`[MIDDLEWARE] User role: ${profile.role}`);

    // Parsear los permisos (pueden venir como string JSON o como objeto)
    let permissions;
    try {
      permissions =
        typeof profile.permissions === "string"
          ? JSON.parse(profile.permissions)
          : profile.permissions;
    } catch (e) {
      console.error(`[MIDDLEWARE] Error parsing permissions: ${e}`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    console.log(
      `[MIDDLEWARE] Permission object:`,
      JSON.stringify(permissions, null, 2)
    );

    // Obtener el permiso requerido para esta ruta
    const requiredPermission = getRequiredPermission(pathname);

    console.log(
      `[MIDDLEWARE] Required permission for ${pathname}: ${requiredPermission}`
    );

    // Si no se encontró un permiso requerido, denegar acceso
    if (!requiredPermission) {
      console.log(
        `[MIDDLEWARE] No permission mapping found for ${pathname}, denying access`
      );
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Reemplazar la verificación de permisos actual con la nueva función
    const hasPermission = checkPermission(permissions, requiredPermission);

    console.log(
      `[MIDDLEWARE] User has permission for ${requiredPermission}: ${hasPermission}`
    );

    if (!hasPermission) {
      console.log(`[MIDDLEWARE] Access denied for ${pathname}, redirecting`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Si tiene permisos, permitir acceso
    console.log(`[MIDDLEWARE] Access granted to ${pathname}`);
    return res;
  } catch (error) {
    console.error(`[MIDDLEWARE] Error:`, error);
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }
}

// Configuración de matcher para que el middleware se ejecute en las rutas necesarias
export const config = {
  matcher: [
    // Excluir recursos estáticos y API
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|api/).*)",
    // Incluir explícitamente las rutas que queremos proteger
    "/dashboard/:path*",
    "/leads/:path*",
    "/ventas/:path*",
    "/reportes/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/tareas/:path*",
  ],
};
