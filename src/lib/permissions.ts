/**
 * Librería compartida de permisos para Quantum CRM
 * Usada tanto en el servidor (middleware) como en el cliente (hooks)
 */

import { NestedSectionPermissions } from "@/types/dashboard";

// Tipos de scope para permisos
export type PermissionScope = "all" | "team" | "self" | false;

// Estructura de permisos para módulos con scopes
export interface ModulePermission {
  view?: PermissionScope;
  edit?: PermissionScope;
  create?: PermissionScope;
  delete?: PermissionScope;
}

// Permisos de usuario
export interface UserPermissions {
  [key: string]: ModulePermission | undefined;
}

/**
 * Verifica si hay permiso para una sección y acción específicas
 *
 * @param permissions - Objeto de permisos del usuario
 * @param sectionKey - Clave de la sección (ej: 'leads', 'admin.roles')
 * @param action - Acción a verificar ('view', 'edit', 'create', 'delete')
 * @param userInfo - Información opcional del usuario (para verificar rol Super Administrador)
 * @returns boolean - True si tiene permiso, false en caso contrario
 */
export function hasPermission(
  permissions: NestedSectionPermissions | null | undefined,
  sectionKey: string,
  action: string = "view",
  userInfo?: { role?: string } | null
): boolean {
  // Super Administrador siempre tiene todos los permisos
  if (userInfo?.role === "Super Administrador") {
    console.debug(
      `[PERMISSION] Super Administrador bypass: ${sectionKey}.${action}`
    );
    return true;
  }

  if (!permissions || !permissions.sections) return false;

  // Manejar claves con notación de punto (ej: admin.roles)
  if (sectionKey.includes(".")) {
    const [parentKey, childKey] = sectionKey.split(".");

    // Verificar si existe el permiso anidado
    const parentSection = permissions.sections[parentKey];

    if (
      parentSection &&
      typeof parentSection === "object" &&
      childKey in parentSection
    ) {
      // @ts-ignore - Acceso dinámico a la estructura de permisos
      const childSection = parentSection[childKey];
      if (childSection && typeof childSection === "object") {
        const value = childSection[action as keyof typeof childSection];
        console.debug(`[PERMISSION] ${sectionKey}.${action} =`, value);
        return value !== false && value !== undefined;
      }
      return false;
    }

    // Si no hay permiso específico, verificar acceso completo a la sección padre
    if (
      parentSection &&
      typeof parentSection === "object" &&
      "view" in parentSection
    ) {
      const value = parentSection.view;
      console.debug(`[PERMISSION] ${parentKey}.view (fallback) =`, value);
      return action === "view" && value !== false && value !== undefined;
    }

    return false;
  }

  // Manejar sección simple
  const sectionPermission = permissions.sections[sectionKey];

  // Si es un objeto directo de permisos
  if (sectionPermission && action in sectionPermission) {
    // @ts-ignore - Necesitamos acceder dinámicamente
    const value = sectionPermission[action];
    console.debug(`[PERMISSION] ${sectionKey}.${action} =`, value);
    return value !== false && value !== undefined;
  }

  return false;
}

/**
 * Obtiene el scope de permisos para una sección y acción
 *
 * @param permissions - Objeto de permisos del usuario
 * @param sectionKey - Clave de la sección (ej: 'leads', 'admin.roles')
 * @param action - Acción a verificar ('view', 'edit', 'create', 'delete')
 * @returns PermissionScope - 'all', 'team', 'self' o false
 */
export function getScope(
  permissions: NestedSectionPermissions | null | undefined,
  sectionKey: string,
  action: string = "view"
): PermissionScope {
  if (!permissions || !permissions.sections) return false;

  // Si es un permiso con formato de scope
  if (sectionKey.includes(".")) {
    const [parentKey, childKey] = sectionKey.split(".");

    const parentSection = permissions.sections[parentKey];
    if (!parentSection || typeof parentSection !== "object") return false;

    // @ts-ignore - Acceso dinámico
    const childSection = parentSection[childKey];
    if (!childSection || typeof childSection !== "object") return false;

    const value = childSection[action as keyof typeof childSection];
    if (typeof value === "string") {
      return value as PermissionScope;
    }
    // Para compatibilidad con formato booleano anterior
    return value === true ? "all" : false;
  }

  // Manejar sección simple
  const sectionPermission = permissions.sections[sectionKey];
  if (!sectionPermission) return false;

  const value = sectionPermission[action as keyof typeof sectionPermission];
  if (typeof value === "string") {
    return value as PermissionScope;
  }
  // Para compatibilidad con formato booleano anterior
  return value === true ? "all" : false;
}

/**
 * Extrae la clave de sección de una ruta
 *
 * @param pathname - Ruta (ej: '/admin/roles', '/leads')
 * @returns string - Clave de sección (ej: 'admin.roles', 'leads')
 */
export function getSectionKeyFromPath(pathname: string): string | null {
  // Eliminar parámetros de consulta y fragmentos
  const cleanPath = pathname.split(/[?#]/)[0];

  // Dividir la ruta en segmentos
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  // Caso especial para admin y otras secciones con subsecciones
  if (segments[0] === "admin" && segments.length > 1) {
    return `admin.${segments[1]}`;
  }

  // Para rutas como /dashboard, /leads, etc.
  return segments[0];
}
