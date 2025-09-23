"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { User as AppUser } from "@/types/user";
import { ReauthenticationModal } from "@/components/auth/reauthentication-modal";
import { authCircuitBreaker, authBackoff } from "@/lib/utils/circuit-breaker";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  showReauthModal: (reason?: "expired" | "forbidden" | "invalid") => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  appUser: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  showReauthModal: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReauth, setShowReauth] = useState(false);
  const [reauthReason, setReauthReason] = useState<"expired" | "forbidden" | "invalid">("expired");
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Función para mostrar el modal de reautenticación
  const showReauthModal = (reason: "expired" | "forbidden" | "invalid" = "expired") => {
    setReauthReason(reason);
    setShowReauth(true);
  };

  // Fetch user function con circuit breaker y manejo de errores 403
  const fetchUser = async (
    userId: string,
    retryCount = 0
  ): Promise<AppUser | null> => {
    try {
      return await authCircuitBreaker.call(async () => {
        return await authBackoff.execute(async () => {
          const response = await fetch(`/api/users/${userId}?requireAuth=false`);

          if (!response.ok) {
            if (response.status === 403) {
              // Mostrar modal de reautenticación en lugar de lanzar error
              showReauthModal("forbidden");
              return null;
            }

            if (response.status === 401) {
              showReauthModal("expired");
              return null;
            }

            throw new Error(
              `Error al obtener datos de usuario: ${response.status}`
            );
          }

          const data = await response.json();
          return data.profile;
        }, `fetch-user-${userId}`);
      });
    } catch (error) {
      console.error("Error al cargar datos de usuario:", error);

      // Si es un error de circuit breaker, mostrar modal
      if (error instanceof Error && error.message.includes('Circuit breaker')) {
        showReauthModal("invalid");
      }

      return null;
    }
  };

  // Inicializar autenticación
  const initializeAuth = async () => {
    try {
      // Usar getUser para verificar estado de autenticación (menos solicitudes)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setSession(null);
        setAppUser(null);
        setIsLoading(false);
        return;
      }

      setUser(authUser);

      // Solo obtener la sesión si el usuario está autenticado
      if (authUser) {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        setSession(authSession);

        // Obtener perfil del usuario
        const profile = await fetchUser(authUser.id);
        if (profile) {
          setAppUser(profile);
        } else {
          // Si no se puede obtener el perfil, limpiar sesión
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
      }
    } catch (error) {
      console.error("Error al inicializar auth:", error);
      // Limpiar estado en caso de error
      setUser(null);
      setSession(null);
      setAppUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Ejecutar inicialización
    initializeAuth();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setSession(null);
        setAppUser(null);
        router.push("/sign-in");
        return;
      }

      setSession(session);
      setUser(session.user ?? null);

      if (session?.user) {
        const profile = await fetchUser(session.user.id);
        setAppUser(profile);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Iniciar sesión con Supabase
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Rate limit")) {
          throw new Error("Demasiados intentos fallidos. Intenta más tarde.");
        }
        throw error;
      }

      if (!data.user) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      // Obtener datos del usuario
      const profile = await fetchUser(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Error al obtener datos de usuario");
      }

      // Verificar que el usuario tiene un rol válido y está activo
      if (!profile.roleId) {
        await supabase.auth.signOut();
        throw new Error(
          "Tu cuenta no tiene un rol asignado. Contacta al administrador"
        );
      }

      if (!profile.isActive) {
        await supabase.auth.signOut();
        throw new Error(
          "Tu cuenta está desactivada. Contacta al administrador"
        );
      }

      // Establecer datos del usuario y redirigir
      setAppUser(profile);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);

      // Asegurar limpieza de sesión en cualquier error
      await supabase.auth.signOut();

      // Traducir errores comunes de Supabase a mensajes amigables
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Email o contraseña incorrectos");
      } else if (
        error.message.includes("Too many requests") ||
        error.message.includes("Rate limit")
      ) {
        throw new Error("Demasiados intentos fallidos. Intenta más tarde");
      }

      // Lanzar el error original o uno personalizado
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    throw new Error(
      "Registro público no permitido. Los usuarios solo pueden ser creados por administradores."
    );
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      // Primero limpiamos los estados internos
      setUser(null);
      setSession(null);
      setAppUser(null);

      // Luego cerramos sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Limpiar manualmente cualquier caché o storage local adicional
      if (typeof window !== "undefined") {
        // Eliminar cualquier otra clave de storage que pueda contener datos de usuario
        const keysToRemove = [
          "user-storage",
          "user-storage-v1",
          "supabase.auth.token",
        ];
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignorar errores al limpiar storage
          }
        });
      }

      router.replace("/sign-in");
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
      // Forzar redirección en caso de error
      router.replace("/sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        appUser: appUser,
        isLoading,
        signIn,
        signUp,
        signOut,
        showReauthModal,
      }}
    >
      {children}

      <ReauthenticationModal
        isOpen={showReauth}
        onClose={() => setShowReauth(false)}
        reason={reauthReason}
        lastEmail={user?.email || ""}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
