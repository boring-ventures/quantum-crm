"use client";

import { useEffect, useState, useCallback } from "react";
import type { NestedSectionPermissions } from "@/types/dashboard";

// Permisos vacíos por defecto
const emptyPermissions: NestedSectionPermissions = {
  sections: {},
};

export function useRolePermissions() {
  const [permissions, setPermissions] =
    useState<NestedSectionPermissions>(emptyPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPermissions() {
      try {
        setLoading(true);

        // Obtener permisos del rol desde la API
        const response = await fetch(`/api/auth/user-permissions`);

        // Aunque la respuesta no sea exitosa, no lanzar error
        const data = await response.json();

        if (isMounted) {
          setPermissions(data.permissions || emptyPermissions);
        }
      } catch (err) {
        console.error("Error al obtener los permisos del rol:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
          // En caso de error, establecer permisos vacíos
          setPermissions(emptyPermissions);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para verificar si tiene permisos para ver una sección
  // Usar useCallback para evitar regenerar la función en cada renderizado
  const canViewSection = useCallback(
    (sectionKey: string): boolean => {
      if (!permissions || !permissions.sections) return false;

      // Manejar keys con notación de punto (admin.roles)
      if (sectionKey.includes(".")) {
        const [parentKey, childKey] = sectionKey.split(".");

        // Verificar si existe el permiso anidado
        const parentSection = permissions.sections[parentKey];

        if (
          parentSection &&
          typeof parentSection === "object" &&
          childKey in parentSection
        ) {
          const childSection = parentSection[childKey];
          return (
            childSection &&
            typeof childSection === "object" &&
            childSection.view === true
          );
        }

        return false;
      }

      // Manejar sección simple
      const sectionPermission = permissions.sections[sectionKey];

      // Si es un objeto directo de permisos
      if (sectionPermission && "view" in sectionPermission) {
        return sectionPermission.view === true;
      }

      // Si es un objeto anidado (para secciones como 'admin')
      if (sectionPermission && typeof sectionPermission === "object") {
        // Si al menos una subsección tiene permisos de visualización, mostrar la sección principal
        return Object.values(sectionPermission).some(
          (subPermission) =>
            subPermission &&
            typeof subPermission === "object" &&
            subPermission.view === true
        );
      }

      return false;
    },
    [permissions]
  );

  return { permissions, loading, error, canViewSection };
}
