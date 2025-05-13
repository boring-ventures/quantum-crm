import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

<<<<<<< HEAD
// Rutas públicas que no requieren autenticación (paths exactos o prefijos)
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/",
  "/access-denied",
  "/_next",
  "/favicon.ico",
  "/forgot-password",
  "/privacy",
  "/terms",
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
=======
export async function middleware(req: NextRequest) {
>>>>>>> parent of 2bfa236 (Merge pull request #4 from boring-ventures/users_section)
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and the user is trying to access a protected route
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access auth routes
  if (session && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
}; 