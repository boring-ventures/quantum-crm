"use server";

// This is a placeholder implementation for authentication
// In a real application, you would use a proper auth library like NextAuth.js
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Crear cliente de Supabase para componentes del servidor
const getSupabase = async () => {
  // Asegurar que las cookies se obtengan de forma asíncrona
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  roleId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

interface Session {
  user: User;
  expires: Date;
}

// Evitar consultas simultáneas para la misma sesión
let authPromise: Promise<Session | null> | null = null;

// Implementación para obtener la sesión del usuario
export async function auth(): Promise<Session | null> {
  // Si ya hay una promesa en curso, reutilizarla para evitar múltiples llamadas en paralelo
  if (authPromise) {
    return authPromise;
  }

  // Crear una nueva promesa y almacenarla
  authPromise = _authImplementation();

  try {
    // Esperar el resultado y devolverlo
    return await authPromise;
  } finally {
    // Limpiar la promesa almacenada después de completar
    authPromise = null;
  }
}

// Implementación real de la autenticación
async function _authImplementation(): Promise<Session | null> {
  try {
    const supabase = await getSupabase();

    // Obtener usuario actual en lugar de sesión
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Si hay error o no hay usuario, retornar null
    if (error || !user) {
      console.log("No hay usuario activo o error:", error);
      return null;
    }

    console.log("Usuario Supabase encontrado:", user.id);

    // Usar la API en lugar de consultar directamente a Supabase
    try {
      // Construir la URL absoluta para la API de usuarios
      let baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.VERCEL_URL ||
        "http://localhost:3000";

      // Asegurarse de que la URL base tenga el protocolo correcto
      if (!baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`;
      }

      console.log("URL base para API:", baseUrl);

      // Construir URL completa
      const apiUrl = new URL(`/api/users/${user.id}`, baseUrl);
      apiUrl.searchParams.append("requireAuth", "false");

      console.log("Consultando API de usuario:", apiUrl.toString());

      const response = await fetch(apiUrl.toString(), {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Respuesta API status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log(
          "Error al obtener datos de usuario desde API:",
          response.status,
          responseText
        );
        await supabase.auth.signOut();
        return null;
      }

      const responseData = await response.json();
      const { profile } = responseData;

      console.log(
        "Perfil obtenido:",
        profile ? "Sí" : "No",
        profile ? `roleId: ${profile.roleId}` : ""
      );

      // Verificar si el usuario está eliminado
      if (profile && profile.isDeleted) {
        console.log("Usuario ha sido eliminado");
        await supabase.auth.signOut();
        return null;
      }

      // Verificar si el usuario está activo
      if (!profile || !profile.isActive) {
        console.log("Usuario no encontrado o inactivo");
        await supabase.auth.signOut();
        return null;
      }

      // Calcular fecha de expiración (24 horas desde ahora como fallback)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);

      // Retornar datos del usuario obtenidos a través de la API
      return {
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
  ];
  if (publicRoutes.includes(path)) return true;

  // Para todas las demás rutas, verificar autenticación
  const session = await auth();
  if (!session?.user?.roleId) return false;

  return true;
}
