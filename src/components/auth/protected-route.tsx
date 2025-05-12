"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkUserRole, checkRouteAccess } from "@/lib/server-auth";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { loading: permissionsLoading } = useRolePermissions();

  // Memoizar los roles requeridos para evitar renderizados innecesarios
  const requiredRolesString = requiredRoles ? requiredRoles.join(",") : "";

  // Verificar la autorización solo cuando cambie la ruta o los roles requeridos
  const checkAuth = useCallback(async () => {
    try {
      // Verificación básica de acceso a la ruta actual
      const accessAllowed = await checkRouteAccess(pathname);

      // Si se especificaron roles requeridos, verificar si el usuario tiene alguno de ellos
      let roleCheck = true;
      if (requiredRoles && requiredRoles.length > 0) {
        roleCheck = await checkUserRole(requiredRoles);
      }

      // El usuario está autorizado si tiene acceso a la ruta y el rol requerido
      const authorized = accessAllowed && roleCheck;
      setIsAuthorized(authorized);

      // Redirigir a página de acceso denegado si no está autorizado
      if (!authorized) {
        router.push("/access-denied");
      }
    } catch (error) {
      console.error("Error al verificar autorización:", error);
      setIsAuthorized(false);
      router.push("/access-denied");
    }
  }, [pathname, router, requiredRoles]);

  useEffect(() => {
    // Solo verificar cuando no se esté cargando permisos
    if (!permissionsLoading) {
      checkAuth();
    }
  }, [checkAuth, permissionsLoading]);

  // Mientras se verifica la autorización, mostrar pantalla de carga o nada
  if (isAuthorized === null || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando...
      </div>
    );
  }

  // Si está autorizado, mostrar los hijos
  return isAuthorized ? <>{children}</> : null;
}
