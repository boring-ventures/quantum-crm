"use client";

import { useEffect, useState, useCallback } from "react";

// Definición para permisos en formato plano
interface PlainPermissions {
  [key: string]: {
    view: boolean | string;
    create?: boolean | string;
    edit?: boolean | string;
    delete?: boolean | string;
    [key: string]: any;
  };
}

// Permisos vacíos por defecto
const emptyPermissions: PlainPermissions = {};

export function useRolePermissions() {
  const [permissions, setPermissions] =
    useState<PlainPermissions>(emptyPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPermissions() {
      try {
        setLoading(true);
        console.log("[PERMISSIONS] Obteniendo permisos de usuario...");

        // Obtener permisos del rol desde la API
        const response = await fetch(`/api/auth/user-permissions`);

        // Aunque la respuesta no sea exitosa, no lanzar error
        const data = await response.json();
        console.log("[PERMISSIONS] Permisos recibidos:", data.permissions);

        if (isMounted) {
          setPermissions(data.permissions || emptyPermissions);
        }
      } catch (err) {
        console.error(
          "[PERMISSIONS] Error al obtener los permisos del rol:",
          err
        );
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
      if (!permissions || Object.keys(permissions).length === 0) {
        console.log(`[PERMISSIONS] Sin permisos para verificar: ${sectionKey}`);
        return false;
      }

      console.log(`[PERMISSIONS] Verificando permiso para: ${sectionKey}`);

      // Manejar keys con notación de punto (admin.roles, admin.countries)
      if (sectionKey.includes(".")) {
        const [parentKey, childKey] = sectionKey.split(".");

        // Primero verificamos si hay un permiso específico para la clave anidada completa
        if (
          permissions[sectionKey] &&
          (permissions[sectionKey].view === true ||
            permissions[sectionKey].view === "all" ||
            permissions[sectionKey].view === "team" ||
            permissions[sectionKey].view === "self")
        ) {
          console.log(
            `[PERMISSIONS] Acceso concedido por clave específica: ${sectionKey}`
          );
          return true;
        }

        // Si no hay permiso específico, verificamos si hay permisos para el padre o el hijo
        const parentPermission = permissions[parentKey];
        const childPermission = permissions[childKey];

        // Si el padre tiene permisos de visualización, permitir acceso
        if (
          parentPermission &&
          (parentPermission.view === true ||
            parentPermission.view === "all" ||
            parentPermission.view === "team" ||
            parentPermission.view === "self")
        ) {
          console.log(
            `[PERMISSIONS] Acceso concedido por permiso padre: ${parentKey}`
          );
          return true;
        }

        // Si el hijo tiene permisos de visualización, permitir acceso
        if (
          childPermission &&
          (childPermission.view === true ||
            childPermission.view === "all" ||
            childPermission.view === "team" ||
            childPermission.view === "self")
        ) {
          console.log(
            `[PERMISSIONS] Acceso concedido por permiso hijo: ${childKey}`
          );
          return true;
        }

        // Si el permiso es para countries y el usuario tiene permiso para admin
        if (
          childKey === "countries" &&
          parentPermission &&
          (parentPermission.view === true || parentPermission.view === "all")
        ) {
          console.log(`[PERMISSIONS] Acceso a países concedido por ser admin`);
          return true;
        }

        console.log(`[PERMISSIONS] Acceso denegado para: ${sectionKey}`);
        return false;
      }

      // Si es admin, tiene acceso a todas las secciones de administración
      if (
        sectionKey === "admin" &&
        permissions.admin &&
        (permissions.admin.view === true || permissions.admin.view === "all")
      ) {
        console.log(`[PERMISSIONS] Acceso concedido para admin`);
        return true;
      }

      // Manejar sección simple
      const sectionPermission = permissions[sectionKey];

      if (!sectionPermission) {
        console.log(
          `[PERMISSIONS] No se encontraron permisos para: ${sectionKey}`
        );
        return false;
      }

      // Verificar permiso de visualización
      const hasAccess =
        sectionPermission.view === true ||
        sectionPermission.view === "all" ||
        sectionPermission.view === "team" ||
        sectionPermission.view === "self";

      console.log(
        `[PERMISSIONS] Sección ${sectionKey} - Permiso view:`,
        sectionPermission.view,
        `HasAccess:`,
        hasAccess
      );

      return hasAccess;
    },
    [permissions]
  );

  return { permissions, loading, error, canViewSection };
}
