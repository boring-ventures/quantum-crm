import { useState, useEffect, useCallback } from "react";
import { Role } from "@/types/role";
import { NestedSectionPermissions, SectionPermission } from "@/types/dashboard";
import {
  hasPermission as sharedHasPermission,
  getScope as sharedGetScope,
  PermissionScope,
} from "@/lib/utils/permissions";

/**
 * Hook para gestionar los permisos de un usuario basado en su rol
 */
export function usePermissions(userRole?: Role | null) {
  const [permissions, setPermissions] =
    useState<NestedSectionPermissions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar los permisos cuando cambia el rol
  useEffect(() => {
    if (!userRole) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      // Asumimos que los permisos están en el formato correcto
      const rolePermissions =
        userRole.permissions as unknown as NestedSectionPermissions;
      setPermissions(rolePermissions);
      setError(null);
    } catch (err) {
      console.error("Error parsing permissions:", err);
      setError("Error al procesar los permisos del usuario");
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param sectionKey - Clave de la sección (por ejemplo, 'leads', 'users', 'admin.roles')
   * @param permission - Tipo de permiso ('view', 'create', 'edit', 'delete')
   */
  const hasPermission = useCallback(
    (
      sectionKey: string,
      permission: keyof SectionPermission = "view"
    ): boolean => {
      return sharedHasPermission(permissions, sectionKey, permission as string);
    },
    [permissions, userRole]
  );

  /**
   * Obtiene el scope de un permiso específico
   * @param sectionKey - Clave de la sección (por ejemplo, 'leads', 'users')
   * @param permission - Tipo de permiso ('view', 'create', 'edit', 'delete')
   * @returns "all" | "team" | "self" | false
   */
  const getScope = useCallback(
    (
      sectionKey: string,
      permission: keyof SectionPermission = "view"
    ): PermissionScope => {
      return sharedGetScope(permissions, sectionKey, permission as string);
    },
    [permissions]
  );

  /**
   * Obtiene las secciones a las que el usuario tiene acceso de visualización
   */
  const getAccessibleSections = useCallback((): string[] => {
    if (!permissions || !permissions.sections) return [];

    return Object.keys(permissions.sections).filter((sectionKey) =>
      hasPermission(sectionKey, "view")
    );
  }, [permissions, hasPermission]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    getScope,
    getAccessibleSections,
  };
}
