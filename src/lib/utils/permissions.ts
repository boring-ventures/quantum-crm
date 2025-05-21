import { SectionPermission, NestedSectionPermissions } from "@/types/dashboard";
import { type User } from "@/types/user";

/**
 * Crea una estructura de permisos para un rol con todas las secciones establecidas
 * @param sections - Lista de claves de secciones
 * @param defaultAccess - Si todas las secciones deben tener acceso por defecto
 */
export function createEmptyPermissions(
  sections: string[],
  defaultAccess: boolean = false
): NestedSectionPermissions {
  const sectionPermissions: Record<string, SectionPermission> = {};

  sections.forEach((section) => {
    sectionPermissions[section] = {
      view: defaultAccess,
      create: defaultAccess,
      edit: defaultAccess,
      delete: defaultAccess,
    };
  });

  return {
    sections: sectionPermissions,
  };
}

/**
 * Crea permisos para el rol de Vendedor
 */
export function createSalesRolePermissions(): NestedSectionPermissions {
  return {
    sections: {
      dashboard: { view: true },
      leads: { view: true, create: true, edit: true, delete: false },
      sales: { view: true, create: true, edit: true, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
    },
  };
}

/**
 * Crea permisos para el rol de Gerente
 */
export function createManagerRolePermissions(): NestedSectionPermissions {
  return {
    sections: {
      dashboard: { view: true },
      leads: { view: true, create: true, edit: true, delete: false },
      sales: { view: true, create: true, edit: true, delete: false },
      reports: { view: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      users: { view: true },
    },
  };
}

/**
 * Crea permisos para el rol de Administrador
 */
export function createAdminRolePermissions(): NestedSectionPermissions {
  return {
    sections: {
      dashboard: { view: true },
      leads: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: true, edit: true, delete: true },
      reports: { view: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      admin: {
        products: { view: true, create: true, edit: true, delete: true },
        leads: { view: true, create: true, edit: true, delete: true },
      },
    },
  };
}

/**
 * Crea permisos para el rol de Super Administrador
 */
export function createSuperAdminRolePermissions(): NestedSectionPermissions {
  return {
    sections: {
      dashboard: { view: true },
      leads: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: true, edit: true, delete: true },
      reports: { view: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      admin: {
        roles: { view: true, create: true, edit: true, delete: true },
        products: { view: true, create: true, edit: true, delete: true },
        leads: { view: true, create: true, edit: true, delete: true },
      },
    },
  };
}

/**
 * Comprueba si un objeto tiene la estructura esperada para los permisos
 * @param data - Objeto a validar
 */
export function isValidPermissionsObject(data: any): boolean {
  if (!data || typeof data !== "object") {
    console.log("isValidPermissionsObject: data no es un objeto", data);
    return false;
  }

  // Detectar si es el formato nuevo (plano) o el antiguo (con sections)
  const isNewFormat = !data.sections && Object.keys(data).length > 0;

  if (isNewFormat) {
    // Validar formato plano: cada clave es una sección con permisos
    for (const key in data) {
      const section = data[key];
      if (!isValidPermissionSection(section)) {
        console.log(
          `isValidPermissionsObject: Sección inválida ${key}`,
          section
        );
        return false;
      }
    }
    return true;
  }

  // Validar formato antiguo con sections
  if (!data.sections || typeof data.sections !== "object") {
    console.log(
      "isValidPermissionsObject: data.sections no existe o no es un objeto",
      data
    );
    return false;
  }

  // Verificar cada sección
  for (const key in data.sections) {
    const section = data.sections[key];

    // Caso 1: La sección es un objeto de permisos directo
    if (isValidPermissionSection(section)) continue;

    // Caso 2: La sección contiene subsecciones
    if (typeof section === "object" && section !== null) {
      let validSubsections = true;

      for (const subKey in section) {
        if (!isValidPermissionSection(section[subKey])) {
          console.log(
            `isValidPermissionsObject: Subsección inválida ${key}.${subKey}`,
            section[subKey]
          );
          validSubsections = false;
          break;
        }
      }

      if (validSubsections) continue;
    }

    console.log(`isValidPermissionsObject: Sección inválida ${key}`, section);
    return false;
  }

  return true;
}

/**
 * Comprueba si un objeto tiene la estructura de una sección de permisos válida
 * @param section - Sección a validar
 */
function isValidPermissionSection(section: any): boolean {
  if (!section || typeof section !== "object") {
    console.log("isValidPermissionSection: section no es un objeto", section);
    return false;
  }

  // Debe tener al menos la propiedad 'view' como booleano o string válido
  if (
    !["boolean", "string"].includes(typeof section.view) ||
    (typeof section.view === "string" &&
      !["all", "team", "self"].includes(section.view))
  ) {
    console.log(
      "isValidPermissionSection: propiedad 'view' inválida",
      section.view
    );
    return false;
  }

  // Verificar que otras propiedades opcionales sean booleanas o string válido
  const optionalProps = ["create", "edit", "delete"];
  for (const prop of optionalProps) {
    if (
      prop in section &&
      !(
        typeof section[prop] === "boolean" ||
        (typeof section[prop] === "string" &&
          ["all", "team", "self"].includes(section[prop]))
      )
    ) {
      console.log(
        `isValidPermissionSection: propiedad '${prop}' inválida`,
        section[prop]
      );
      return false;
    }
  }

  return true;
}

// Tipo para scope de permisos por acción CRUD
export type PermissionScope = "self" | "team" | "all" | false;

/**
 * Verifica si hay permiso para una sección y acción específicas (versión compatible con middleware)
 *
 * @param permissions - Objeto de permisos del usuario
 * @param sectionKey - Clave de la sección (ej: 'leads', 'admin.roles')
 * @param action - Acción a verificar ('view', 'edit', 'create', 'delete')
 * @param userInfo - Información opcional del usuario (para verificar rol Super Administrador)
 * @returns boolean - True si tiene permiso, false en caso contrario
 */
export function hasPermission(
  permissions: NestedSectionPermissions | null | undefined | User,
  sectionKey: string,
  action: string = "view",
  userInfo?: { role?: string } | null
): boolean {
  // Detectar si se está llamando con la interfaz antigua (User) o nueva (NestedSectionPermissions)
  if (permissions && "id" in permissions) {
    // Interfaz antigua con User, redirigir a la función existente
    return hasPermission_user(permissions as User, sectionKey, action);
  }

  // Super Administrador siempre tiene todos los permisos
  if (userInfo?.role === "Super Administrador") {
    console.debug(
      `[PERMISSION] Super Administrador bypass: ${sectionKey}.${action}`
    );
    return true;
  }

  if (!permissions || !("sections" in permissions) || !permissions.sections)
    return false;

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

// Renombrar la función antigua para evitar conflictos
export function hasPermission_user(
  user: User | null,
  module: string,
  action: string
): boolean {
  if (!user) return false;

  // Super Admin siempre tiene todos los permisos
  if (user.role === "Super Administrador") return true;

  if (!user.userPermission?.permissions) return false;

  // Extraer permisos
  const permissions =
    typeof user.userPermission.permissions === "string"
      ? JSON.parse(user.userPermission.permissions)
      : user.userPermission.permissions;

  // Verificar si el módulo existe
  if (!permissions[module]) return false;

  // Verificar si la acción existe y es truthy (true o un string scope)
  const actionPermission = permissions[module][action];
  return !!actionPermission;
}

/**
 * Obtiene el scope de permisos para una sección y acción (versión compatible con middleware)
 *
 * @param permissions - Objeto de permisos del usuario
 * @param sectionKey - Clave de la sección (ej: 'leads', 'admin.roles')
 * @param action - Acción a verificar ('view', 'edit', 'create', 'delete')
 * @returns PermissionScope - 'all', 'team', 'self' o false
 */
export function getScope(
  permissions: NestedSectionPermissions | null | undefined | User,
  sectionKey: string,
  action: string = "view"
): PermissionScope {
  // Detectar si se está llamando con la interfaz antigua (User) o nueva (NestedSectionPermissions)
  if (permissions && "id" in permissions) {
    // Interfaz antigua con User, redirigir a la función existente
    return getScope_user(permissions as User, sectionKey, action);
  }

  if (!permissions || !("sections" in permissions) || !permissions.sections)
    return false;

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

// Renombrar la función antigua para evitar conflictos
export function getScope_user(
  user: User | null,
  module: string,
  action: string
): PermissionScope {
  if (!user) return false;

  // Super Admin siempre tiene scope "all"
  if (user.role === "Super Administrador") return "all";

  if (!user.userPermission?.permissions) return false;

  // Extraer permisos
  const permissions =
    typeof user.userPermission.permissions === "string"
      ? JSON.parse(user.userPermission.permissions)
      : user.userPermission.permissions;

  // Verificar si el módulo existe
  if (!permissions[module]) return false;

  // Si la acción existe y es un boolean true, tratar como "all"
  const actionPermission = permissions[module][action];
  if (actionPermission === true) return "all";

  // Si es un string de scope, retornar el scope
  if (typeof actionPermission === "string") {
    if (["self", "team", "all"].includes(actionPermission)) {
      return actionPermission as PermissionScope;
    }
  }

  return false;
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

/**
 * Verifica si un usuario puede acceder a un recurso basado en el scope
 */
export function canAccessResource(
  user: User | null,
  resourceOwnerId: string,
  resourceCountryId: string | null,
  scope: PermissionScope
): boolean {
  if (!user) return false;

  // Super Admin siempre tiene acceso
  if (user.role === "Super Administrador") return true;

  // Usar el scope para determinar acceso
  switch (scope) {
    case "all":
      return true;

    case "team":
      return (
        !!user.countryId &&
        !!resourceCountryId &&
        user.countryId === resourceCountryId
      );

    case "self":
      return user.id === resourceOwnerId;

    default:
      return false;
  }
}

/**
 * Comprueba permisos completos para un recurso
 */
export function checkPermission(
  user: User | null,
  module: string,
  action: string,
  resourceOwnerId?: string,
  resourceCountryId?: string | null
): { allowed: boolean; reason?: string } {
  // Verificar permiso básico
  if (!hasPermission(user, module, action)) {
    return {
      allowed: false,
      reason: `No tienes permiso para ${action} en ${module}`,
    };
  }

  // Si no hay datos de recurso, solo comprobamos permiso básico
  if (!resourceOwnerId && !resourceCountryId) {
    return { allowed: true };
  }

  // Obtener scope
  const scope = getScope(user, module, action);

  // Verificar acceso basado en scope
  const hasAccess = canAccessResource(
    user,
    resourceOwnerId || "",
    resourceCountryId || null,
    scope
  );

  if (!hasAccess) {
    return {
      allowed: false,
      reason: `No tienes acceso a este recurso con scope '${scope}'`,
    };
  }

  return { allowed: true };
}
