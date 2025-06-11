import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import {
  getSectionKeyFromPath,
  hasPermission as sharedHasPermission,
} from "@/lib/utils/permissions";
import { NestedSectionPermissions } from "@/types/dashboard";
import {
  getUserForMiddleware,
  getCacheStatistics,
  invalidateUserCache,
} from "@/lib/utils/middleware-cache";

// Rutas públicas que no requieren autenticación (paths exactos o prefijos)
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/",
  "/access-denied",
  "/_next",
  "/favicon.ico",
];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  //console.log(`[MIDDLEWARE] Path: ${pathname}`);

  // Permitir rutas de aprobación/rechazo de ventas sin middleware
  if (pathname.match(/^\/api\/sales\/[^/]+\/(approve|reject)$/)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/") &&
    !pathname.includes("/api/leads/") &&
    !pathname.includes("/api/sales/") &&
    !pathname.includes("/api/users/")
  ) {
    //console.log(`[MIDDLEWARE] Skipping API route: ${pathname}`);
    return NextResponse.next();
  }

  // Excluir explícitamente las rutas de API de usuarios que usa el propio middleware
  if (pathname.match(/^\/api\/users\/[a-zA-Z0-9-]+(\?.*)?$/)) {
    //console.log(`[MIDDLEWARE] Allowing user API route: ${pathname}`);
    return NextResponse.next();
  }

  // Excluir explícitamente las rutas de batch-reassign
  if (pathname === "/api/leads/batch-reassign") {
    return NextResponse.next();
  }

  // Excluir explícitamente las rutas de check-duplicate
  if (pathname === "/api/leads/check-duplicate") {
    return NextResponse.next();
  }

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute(pathname)) {
    //console.log(`[MIDDLEWARE] Public route: ${pathname}, allowing access`);
    return NextResponse.next();
  }

  // Crear respuesta y cliente de Supabase
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    // Verificar sesión usando getUser en lugar de getSession para evitar exceso de solicitudes
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Si no hay usuario, redirigir a login
    if (!user) {
      //console.log(`[MIDDLEWARE] No session, redirecting to sign-in`);
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    //console.log(`[MIDDLEWARE] Session found for user: ${user.id}`);

    // 🚀 OPTIMIZACIÓN: Usar cache inteligente pero mantener compatibilidad
    console.log(
      `[MIDDLEWARE] 🔍 Obteniendo datos de usuario con cache inteligente`
    );

    const userData = await getUserForMiddleware(user.id, request);

    if (!userData) {
      console.error(`[MIDDLEWARE] ❌ No se pudieron obtener datos de usuario`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    const { profile, cacheSource } = userData;

    // Log estadísticas de cache (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.log(`[MIDDLEWARE] 📊 ${getCacheStatistics()}`);
      console.log(
        `[MIDDLEWARE] 🎯 Fuente de datos: ${cacheSource.toUpperCase()}`
      );
    }

    // Verificar si el usuario está eliminado
    if (profile.isDeleted) {
      //console.log(`[MIDDLEWARE] User is deleted, signing out and redirecting`);

      // Invalidar cache y cerrar sesión
      invalidateUserCache(user.id);
      await supabase.auth.signOut();

      // Redirigir a sign-in con mensaje
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("reason", "deleted");

      return NextResponse.redirect(signInUrl);
    }

    // Verificar si el usuario está activo
    if (!profile.isActive) {
      //console.log(`[MIDDLEWARE] User is inactive, signing out and redirecting`);

      // Invalidar cache y cerrar sesión
      invalidateUserCache(user.id);
      await supabase.auth.signOut();

      // Redirigir a sign-in con mensaje
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("reason", "inactive");

      return NextResponse.redirect(signInUrl);
    }

    // 🔧 RESTAURAR LÓGICA ORIGINAL: Usar profile.permissions como antes
    if (!profile.permissions) {
      console.error(`[MIDDLEWARE] No permissions found`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    //console.log(`[MIDDLEWARE] User role: ${profile.role}`);

    // Parsear los permisos (pueden venir como string JSON o como objeto)
    let permissions: NestedSectionPermissions;
    try {
      permissions =
        typeof profile.permissions === "string"
          ? JSON.parse(profile.permissions)
          : profile.permissions;
    } catch (e) {
      console.error(`[MIDDLEWARE] Error parsing permissions: ${e}`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Log de permisos antes de verificar
    // console.log(
    //   `[MIDDLEWARE] Permisos recibidos para el usuario:`,
    //   JSON.stringify(permissions, null, 2)
    // );

    // Extraer la sección de la ruta
    const sectionKey = getSectionKeyFromPath(pathname);
    //console.log(`[MIDDLEWARE] Extracted section key: ${sectionKey}`);

    if (!sectionKey) {
      //console.log(
      //  `[MIDDLEWARE] No section key found for ${pathname}, denying access`
      //);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Verificar permisos
    const userHasPermission = sharedHasPermission(
      permissions,
      sectionKey,
      "view"
    );

    //console.log(
    //  `[MIDDLEWARE] User has permission for ${sectionKey}: ${userHasPermission}`
    //);

    if (!userHasPermission) {
      //console.log(`[MIDDLEWARE] Access denied for ${pathname}, redirecting`);
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Para rutas de API a recursos específicos, también verificar permisos de scope
    if (pathname.startsWith("/api/")) {
      // Extraer el módulo y el ID del recurso de la URL
      const parts = pathname.split("/").filter(Boolean);

      if (parts.length >= 3) {
        const module = parts[1]; // 'leads', 'sales', etc.
        const resourceId = parts[2];
        const action =
          request.method === "GET"
            ? "view"
            : request.method === "POST"
              ? "create"
              : request.method === "PUT" || request.method === "PATCH"
                ? "edit"
                : request.method === "DELETE"
                  ? "delete"
                  : "view";

        // Si hay un ID de recurso específico, verificar permisos según el scope
        if (resourceId && resourceId !== "new" && resourceId !== "batch") {
          //console.log(
          //  `[MIDDLEWARE] Checking scope permission for ${module}.${action} on resource ${resourceId}`
          //);

          // 🚀 OPTIMIZACIÓN: Usar el protocolo original para API calls si es necesario
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host") || "localhost:3000";
          const resourceApiUrl = `${protocol}://${host}/api/${module}/${resourceId}?scopeCheck=true`;

          try {
            const resourceResponse = await fetch(resourceApiUrl, {
              headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("cookie") || "",
              },
            });

            if (!resourceResponse.ok) {
              console.error(
                `[MIDDLEWARE] Resource API returned error ${resourceResponse.status}`
              );
              return NextResponse.redirect(
                new URL("/access-denied", request.url)
              );
            }

            // Continuar con la verificación de scope según la implementación existente
            // Esta parte no la modificamos para mantener compatibilidad
            // TODO: Actualizar este código cuando se implemente completamente el nuevo sistema de permisos
          } catch (error) {
            console.error(
              `[MIDDLEWARE] Error checking resource permissions:`,
              error
            );
            return NextResponse.redirect(
              new URL("/access-denied", request.url)
            );
          }
        }
      }
    }

    // Si tiene permisos, permitir acceso
    //console.log(`[MIDDLEWARE] Access granted to ${pathname}`);
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
    "/sales/:path*",
    "/reportes/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/tasks/:path*",
    // Incluir APIs que requieren verificación de permiso por país/scope
    "/api/leads/:path*",
    "/api/sales/:path*",
    "/api/users/:path*",
  ],
};
