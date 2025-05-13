// This is a placeholder implementation for authentication
// In a real application, you would use a proper auth library like NextAuth.js
<<<<<<< HEAD
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Crear cliente de Supabase para componentes del servidor
const getSupabase = async () => {
  try {
    // Asegurar que las cookies se obtengan de forma asíncrona
    const cookieStore = cookies();

    // En entorno de producción, imprimir un log de diagnóstico
    if (process.env.NODE_ENV === "production") {
      console.log("Inicializando Supabase en entorno de producción");
    }

    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Verificar inmediatamente si la sesión es válida para detectar problemas
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error al obtener sesión en getSupabase:", sessionError);
    } else {
      console.log(
        "getSupabase - Sesión:",
        sessionData.session ? "Válida" : "Inválida/Nula"
      );
    }

    return supabase;
  } catch (error) {
    console.error("Error crítico en getSupabase:", error);
    throw error;
  }
};
=======
>>>>>>> parent of 2bfa236 (Merge pull request #4 from boring-ventures/users_section)

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

interface Session {
  user: User;
  expires: Date;
}

// Mock implementation of auth function
export async function auth(): Promise<Session | null> {
  // In a real app, this would check for a valid session
  // For demo purposes, we're returning a mock session

  // If you're implementing a real auth system, replace this with actual auth logic
  const mockUser: User = {
    id: "user_123",
    email: "user@example.com",
    name: "Demo User",
    role: "USER",
  };

  return {
    user: mockUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };
}

<<<<<<< HEAD
// Implementación real de la autenticación
async function _authImplementation(): Promise<Session | null> {
  try {
    const supabase = await getSupabase();

    // Obtener usuario actual en lugar de sesión
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log(
      "auth:_authImplementation - Usuario:",
      user ? `ID: ${user.id}` : "No hay usuario"
    );

    // Si hay error o no hay usuario, retornar null
    if (error || !user) {
      console.log("No hay usuario activo o error:", error);
      return null;
    }

    // Usar la API en lugar de consultar directamente a Supabase
    try {
      // Construir la URL absoluta para la API de usuarios
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "http://localhost:3000";
      const apiUrl = new URL(`/api/users/${user.id}`, baseUrl);
      apiUrl.searchParams.append("requireAuth", "false");

      console.log("API URL:", apiUrl.toString());

      const response = await fetch(apiUrl.toString(), {
        cache: "no-store",
      });

      if (!response.ok) {
        console.log(
          "Error al obtener datos de usuario desde API:",
          await response.text()
        );
        await supabase.auth.signOut();
        return null;
      }

      const { profile } = await response.json();
      console.log(
        "auth:_authImplementation - Perfil de API:",
        profile ? `ID: ${profile.id}, Rol: ${profile.role}` : "No hay perfil"
      );

      // Verificar si el usuario está eliminado
      if (profile && profile.isDeleted) {
        console.log("Usuario ha sido eliminado");
        await supabase.auth.signOut();

        // Limpiar cookie de autenticación (se maneja automáticamente por Supabase)
        return null;
      }

      // Verificar si el usuario está activo
      if (!profile || !profile.isActive) {
        console.log("Usuario no encontrado o inactivo");
        await supabase.auth.signOut();

        // Limpiar cookie de autenticación (se maneja automáticamente por Supabase)
        return null;
      }

      // Calcular fecha de expiración (24 horas desde ahora como fallback)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);

      // Crear objeto de sesión
      const session = {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          roleId: profile.roleId,
          role: profile.role,
          isActive: profile.isActive,
          isDeleted: profile.isDeleted,
        },
        expires: expiryDate,
      };

      console.log(
        "auth:_authImplementation - Sesión creada con roleId:",
        profile.roleId
      );
      return session;
    } catch (apiError) {
      console.error("Error al obtener datos de usuario desde API:", apiError);
      await supabase.auth.signOut();
      return null;
    }
  } catch (error) {
    console.error("Error al autenticar:", error);
    // Limpiar sesión en caso de cualquier error no controlado
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Error al cerrar sesión:", signOutError);
    }
    return null;
  }
}

// Función para obtener el usuario actual (útil para componentes cliente)
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();

  if (!session?.user?.roleId) {
    return null;
  }

  return session.user;
}

// Función para verificar si un usuario tiene un rol específico
export async function hasRole(roleNames: string | string[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;

  const rolesToCheck = Array.isArray(roleNames) ? roleNames : [roleNames];
  return rolesToCheck.includes(session.user.role);
}

// Verifica si un usuario tiene permisos para acceder a una ruta
export async function canAccess(path: string): Promise<boolean> {
  // Rutas públicas que siempre son accesibles
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
  ];
  if (publicRoutes.includes(path)) return true;

  // Para todas las demás rutas, verificar autenticación
  const session = await auth();
  if (!session?.user?.roleId) return false;

  return true;
=======
// Function to get the current user (useful for client components)
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  return session?.user || null;
>>>>>>> parent of 2bfa236 (Merge pull request #4 from boring-ventures/users_section)
}
