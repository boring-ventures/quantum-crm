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
 * Verifica si un usuario tiene permiso para realizar una acción en un módulo
 */
export function hasPermission(
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
 * Obtiene el alcance (scope) de un permiso
 */
export function getScope(
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
