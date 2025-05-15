import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types/user";
import { useCurrentUser } from "@/hooks/use-current-user";

export type UserRoleCheck = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSeller: boolean;
  isManager?: boolean;
  userRole?: string;
  user?: User | null;
  isLoading: boolean;
  error: Error | null;
};

// Constantes para los nombres de rol
export const ROLES = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador",
  SELLER: "Vendedor",
  MANAGER: "Gerente",
  // Agregar otros roles según sea necesario
};

/**
 * Hook para verificar el rol del usuario actual
 * @returns Objeto con flags de roles y datos del usuario
 */
export const useUserRole = (): UserRoleCheck => {
  // Usar el hook existente de useCurrentUser
  const { user, profile, isLoading, error } = useCurrentUser();

  // Convertir datos del perfil al formato esperado por este hook
  const userData: User | null = user
    ? ({
        id: user.id,
        email: user.email || "",
        name: profile?.firstName + " " + profile?.lastName || user.email || "",
        role: profile?.role || "USER",
        isActive: !!profile?.active,
        roleId: "", // Valor predeterminado
        userRole: {
          name: profile?.role || "",
        },
      } as User)
    : null;

  // Determinar los roles basándose en el roleName
  const roleName = userData?.userRole?.name || userData?.role || "";

  const isAdmin = roleName === ROLES.ADMIN;
  const isSuperAdmin = roleName === ROLES.SUPER_ADMIN;
  const isSeller = roleName === ROLES.SELLER;
  const isManager = roleName === ROLES.MANAGER;

  return {
    isAdmin,
    isSuperAdmin,
    isSeller,
    isManager,
    userRole: roleName,
    user: userData,
    isLoading,
    error,
  };
};
