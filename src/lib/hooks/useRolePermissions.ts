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
        console.log("[useRolePermissions] Iniciando obtención de permisos");

        // Obtener permisos del rol desde la API con un timeout para evitar esperas infinitas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máximo

        const response = await fetch(`/api/auth/user-permissions`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeoutId);

        console.log(
          "[useRolePermissions] Respuesta recibida:",
          response.status
        );

        // Aunque la respuesta no sea exitosa, no lanzar error
        const data = await response.json();
        console.log(
          "[useRolePermissions] Permisos obtenidos:",
          data.permissions ? "Presentes" : "Ausentes"
        );

        if (isMounted) {
          setPermissions(data.permissions || emptyPermissions);
        }
      } catch (err) {
        console.error(
          "[useRolePermissions] Error al obtener los permisos:",
          err
        );
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
          // En caso de error, establecer permisos vacíos
          setPermissions(emptyPermissions);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[useRolePermissions] Finalizada carga de permisos");
        }
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
      if (!permissions || !permissions.sections) {
        console.log(
          `[useRolePermissions] Sin permisos para sección: ${sectionKey}`
        );
        return false;
      }

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
          const hasAccess =
            childSection &&
            typeof childSection === "object" &&
            childSection.view === true;

          console.log(
            `[useRolePermissions] Verificando permiso ${sectionKey}: ${hasAccess}`
          );
          return hasAccess;
        }

        console.log(
          `[useRolePermissions] No se encontró permiso anidado para ${sectionKey}`
        );
        return false;
      }

      // Manejar sección simple
      const sectionPermission = permissions.sections[sectionKey];

      // Si es un objeto directo de permisos
      if (sectionPermission && "view" in sectionPermission) {
        const hasAccess = sectionPermission.view === true;
        console.log(
          `[useRolePermissions] Verificando permiso simple ${sectionKey}: ${hasAccess}`
        );
        return hasAccess;
      }

      // Si es un objeto anidado (para secciones como 'admin')
      if (sectionPermission && typeof sectionPermission === "object") {
        // Si al menos una subsección tiene permisos de visualización, mostrar la sección principal
        const hasAnySectionAccess = Object.values(sectionPermission).some(
          (subPermission) =>
            subPermission &&
            typeof subPermission === "object" &&
            subPermission.view === true
        );

        console.log(
          `[useRolePermissions] Verificando permisos anidados para ${sectionKey}: ${hasAnySectionAccess}`
        );
        return hasAnySectionAccess;
      }

      console.log(
        `[useRolePermissions] No se encontraron permisos para ${sectionKey}`
      );
      return false;
    },
    [permissions]
  );

  return { permissions, loading, error, canViewSection };
}
