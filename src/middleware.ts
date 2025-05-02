import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/sign-in", "/sign-up", "/", "/api/auth"];

// Rutas protegidas y sus roles permitidos
const protectedRoutes = {
  "/admin": ["Administrador", "Super Administrador"],
  "/admin/roles": ["Super Administrador"],
  "/reportes": ["Gerente", "Administrador", "Super Administrador"],
  "/users": ["Gerente", "Administrador", "Super Administrador"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a rutas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar sesión de usuario
  const session = await auth();
  if (!session?.user) {
    // Redirigir a login si no hay sesión
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Verificar permisos para rutas protegidas específicas
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (
      pathname.startsWith(route) &&
      !allowedRoles.includes(session.user.role || "")
    ) {
      // Redirigir a dashboard si no tiene permiso
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Configurar el middleware para que se ejecute en las rutas especificadas
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
