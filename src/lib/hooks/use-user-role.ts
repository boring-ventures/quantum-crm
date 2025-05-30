import { useQuery } from "@tanstack/react-query";
import { hasPermission } from "@/lib/utils/permissions";

export function useUserRole() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/users/me");
      if (!response.ok) {
        throw new Error("Error al obtener usuario actual");
      }
      const data = await response.json();
      return data;
    },
  });

  const user = data?.user;

  // Verificar permisos específicos en lugar de usar roles
  const isAdmin = user ? hasPermission(user, "admin", "access") : false;
  const isSeller = user ? hasPermission(user, "leads", "edit") : false;
  const canManageUsers = user ? hasPermission(user, "users", "edit") : false;
  const canManageRoles = user ? hasPermission(user, "roles", "edit") : false;
  const canManageCountries = user
    ? hasPermission(user, "countries", "edit")
    : false;
  const canManageProducts = user
    ? hasPermission(user, "products", "edit")
    : false;

  return {
    user,
    isAdmin,
    isSeller,
    canManageUsers,
    canManageRoles,
    canManageCountries,
    canManageProducts,
    isLoading,
    error,
  };
}
