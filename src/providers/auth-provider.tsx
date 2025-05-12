"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { User as AppUser } from "@/types/user";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  appUser: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch user function
  const fetchUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}?requireAuth=false`);
      if (!response.ok) throw new Error("Error al obtener datos de usuario");
      const data = await response.json();
      setAppUser(data.profile);
    } catch (error) {
      console.error("Error al cargar datos de usuario:", error);
      setAppUser(null);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUser(session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUser(session.user.id);
      } else {
        setAppUser(null);
      }

      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      // Iniciar sesión con Supabase
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      console.log("data.user (auth)", data.user.id);

      // Obtener datos del usuario usando el endpoint API
      const response = await fetch(
        `/api/users/${data.user.id}?requireAuth=false`
      );
      if (!response.ok) {
        const errorData = await response.json();
        // Limpiar la sesión en caso de error
        await supabase.auth.signOut();
        throw new Error(errorData.error || "Error al obtener datos de usuario");
      }

      const { profile } = await response.json();

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
      } else if (error.message.includes("Too many requests")) {
        throw new Error("Demasiados intentos fallidos. Intenta más tarde");
      }

      // Lanzar el error original o uno personalizado
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    throw new Error(
      "Registro público no permitido. Los usuarios solo pueden ser creados por administradores."
    );
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAppUser(null);
    router.push("/sign-in");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
