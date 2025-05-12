import { useState, useEffect, useCallback } from "react";
import { Role } from "@/types/user";
import { NestedSectionPermissions, SectionPermission } from "@/types/dashboard";

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
   * @param sectionKey - Clave de la sección (por ejemplo, 'leads', 'users')
   * @param permission - Tipo de permiso ('view', 'create', 'edit', 'delete')
   * @param subsectionKey - Clave de la subsección (opcional)
   */
  const hasPermission = useCallback(
    (
      sectionKey: string,
      permission: keyof SectionPermission = "view",
      subsectionKey?: string
    ): boolean => {
      if (!permissions || !permissions.sections) return false;

      // Caso 1: Verificar una subsección
      if (subsectionKey) {
        const section = permissions.sections[sectionKey];
        if (!section || typeof section !== "object") return false;

        // @ts-ignore - Necesitamos acceder dinámicamente
        const subsection = section[subsectionKey];
        if (!subsection) return false;

        return !!subsection[permission];
      }

      // Caso 2: Verificar una sección principal
      const section = permissions.sections[sectionKey];
      if (!section) return false;

      if (typeof section === "object" && !Array.isArray(section)) {
        // Si es un objeto con propiedades de permiso directas
        if (permission in section) {
          return !!section[permission as keyof typeof section];
        }
      }

      return false;
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
    getAccessibleSections,
  };
}
