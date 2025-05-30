"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, fetchUser, isLoading } = useUserStore();
  const pathname = usePathname();

  useEffect(() => {
    // Solo fetchear si no hay usuario y no está cargando
    if (!user && !isLoading) {
      fetchUser();
    }
  }, [user, isLoading, fetchUser]);

  // No renderizar nada durante la carga inicial
  if (!user && isLoading) {
    return null;
  }

  return <>{children}</>;
}
