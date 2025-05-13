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
  "/admin/leads": "admin.leads-settings",
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
  let matchedPrefix = "";
  let matchedPermission = null;

  for (const route in protectedRoutes) {
    if (pathname.startsWith(route) && route.length > matchedPrefix.length) {
      matchedPrefix = route;
      matchedPermission = protectedRoutes[route];
      console.log(
        `[MIDDLEWARE] Found matching prefix: ${route} -> ${matchedPermission}`
      );
    }
  }

  // Para rutas como /admin/leads, si no tenemos una coincidencia específica,
  // extraemos el subpath y construimos un permiso compuesto
  if (matchedPrefix && !protectedRoutes[pathname]) {
    const rootKey = matchedPermission;
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length > 1) {
      const subPath = pathParts[1];
      console.log(
        `[MIDDLEWARE] Extracted subpath: ${subPath} from ${pathname}`
      );

      // Si es una ruta como /admin/leads, intentamos un permiso compuesto admin.leads
      if (subPath && subPath !== "roles") {
        // Para /admin/roles ya tenemos una coincidencia explícita
        const composedPermission = `${rootKey}.${subPath}`;
        console.log(
          `[MIDDLEWARE] Created composed permission: ${composedPermission}`
        );
        return composedPermission;
      }
    }
  }

  return matchedPermission;
}

// Agregar una función auxiliar para verificar permisos en estructuras anidadas
function checkPermission(permissions: any, permissionKey: string): boolean {
  // Si es un permiso simple (no anidado)
  if (!permissionKey.includes(".")) {
    // Extraer componentes de la ruta para verificación anidada
    const parts = permissionKey.split(".");
    const rootKey = parts[0];
    const subPath = parts.length > 1 ? parts[1] : null;

    // Verificar si hay un permiso específico para la subruta
    let hasAccess = false;

    if (subPath) {
      hasAccess = permissions.sections?.[rootKey]?.[subPath]?.view === true;
      console.log(
        `[MIDDLEWARE] Checking specific permission ${rootKey}.${subPath}.view: ${hasAccess}`
      );
    }

    // Si no hay permiso específico, verificar si hay permiso general para la ruta raíz
    if (!hasAccess && permissions.sections?.[rootKey]?.view === true) {
      hasAccess = true;
      console.log(
        `[MIDDLEWARE] Falling back to parent permission ${rootKey}.view: true`
      );
    }

    // Verificar si hay permiso en la estructura anidada
    if (!hasAccess && permissions.sections?.[rootKey]) {
      // Verificar si hay un permiso 'leads-settings' para casos como admin.leads-settings
      if (
        permissionKey === "admin" &&
        permissions.sections?.admin?.["leads-settings"]?.view === true
      ) {
        hasAccess = true;
        console.log(
          `[MIDDLEWARE] Found nested permission admin.leads-settings.view: true`
        );
      }
    }

    return hasAccess;
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
    // Verificar sesión - Obtenemos las cookies PRIMERO antes de cualquier operación asíncrona
    const cookieStore = request.cookies;
    const cookieData = Object.fromEntries(
      cookieStore.getAll().map((c) => [c.name, c.value])
    );

    // Luego podemos hacer operaciones asíncronas
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Si no hay sesión, redirigir a login
    if (!session?.user) {
      console.log(`[MIDDLEWARE] No session, redirecting to sign-in`);
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    console.log(`[MIDDLEWARE] Session found for user: ${session.user.id}`);

    // Obtener los permisos del usuario utilizando el endpoint API
    // Construir la URL completa para el fetch
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/users/${session.user.id}?requireAuth=false`;

    console.log(`[MIDDLEWARE] Fetching user data from API: ${apiUrl}`);

    // Usar cookieData para construir la cookie header
    const cookieHeader = Object.entries(cookieData)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    const apiResponse = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!apiResponse.ok) {
      console.error(`[MIDDLEWARE] API returned error ${apiResponse.status}`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    const { profile } = await apiResponse.json();

    if (!profile) {
      console.error(`[MIDDLEWARE] No user profile found`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Verificar si el usuario está eliminado
    if (profile.isDeleted) {
      console.log(`[MIDDLEWARE] User is deleted, signing out and redirecting`);

      // Cerrar sesión del usuario
      await supabase.auth.signOut();

      // Redirigir a sign-in con mensaje
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("reason", "deleted");

      return NextResponse.redirect(signInUrl);
    }

    // Verificar si el usuario está activo
    if (!profile.isActive) {
      console.log(`[MIDDLEWARE] User is inactive, signing out and redirecting`);

      // Cerrar sesión del usuario
      await supabase.auth.signOut();

      // Redirigir a sign-in con mensaje
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("reason", "inactive");

      return NextResponse.redirect(signInUrl);
    }

    if (!profile.permissions) {
      console.error(`[MIDDLEWARE] No permissions found`);
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
