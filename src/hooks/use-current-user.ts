"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { type User } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@prisma/client";

type CurrentUserData = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<void>;
};

export function useCurrentUser(): CurrentUserData {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(session.user);

      // Fetch the user's profile from our API usando el ID del usuario
      const response = await fetch(
        `/api/users/${session.user.id}?requireAuth=false`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error al obtener perfil: ${errorData}`);
      }

      const { profile: profileData } = await response.json();
      // Convertimos los datos del perfil al formato que espera la aplicación
      const adaptedProfile = {
        userId: profileData.id,
        firstName: profileData.name?.split(" ")[0] || "",
        lastName: profileData.name?.split(" ")[1] || "",
        role: profileData.role || "USER",
        active: profileData.isActive ?? true,
        avatarUrl: profileData.avatarUrl || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Profile;

      setProfile(adaptedProfile);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setUser(session.user);

            // Fetch the user's profile when auth state changes
            try {
              const response = await fetch(
                `/api/users/${session.user.id}?requireAuth=false`
              );
              if (response.ok) {
                const { profile: profileData } = await response.json();
                // Adaptamos los datos al formato esperado
                const adaptedProfile = {
                  userId: profileData.id,
                  firstName: profileData.name?.split(" ")[0] || "",
                  lastName: profileData.name?.split(" ")[1] || "",
                  role: profileData.role || "USER",
                  active: profileData.isActive ?? true,
                  avatarUrl: profileData.avatarUrl || "",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as Profile;
                setProfile(adaptedProfile);
              }
            } catch (err) {
              console.error("Error fetching profile:", err);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchUserData]);

  return { user, profile, isLoading, error, refetch: fetchUserData };
}
