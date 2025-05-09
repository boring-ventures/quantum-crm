import { SectionPermission, NestedSectionPermissions } from "@/types/dashboard";

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
      },
    },
  };
}

/**
 * Comprueba si un objeto tiene la estructura esperada para los permisos
 * @param data - Objeto a validar
 */
export function isValidPermissionsObject(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  if (!data.sections || typeof data.sections !== "object") return false;

  // Verificar cada sección
  for (const key in data.sections) {
    const section = data.sections[key];

    // Caso 1: La sección es un objeto de permisos directo
    if (isValidPermissionSection(section)) continue;

    // Caso 2: La sección contiene subsecciones
    if (typeof section === "object") {
      let validSubsections = true;

      for (const subKey in section) {
        if (!isValidPermissionSection(section[subKey])) {
          validSubsections = false;
          break;
        }
      }

      if (validSubsections) continue;
    }

    return false;
  }

  return true;
}

/**
 * Comprueba si un objeto tiene la estructura de una sección de permisos válida
 * @param section - Sección a validar
 */
function isValidPermissionSection(section: any): boolean {
  if (!section || typeof section !== "object") return false;

  // Debe tener al menos la propiedad 'view'
  if (typeof section.view !== "boolean") return false;

  // Verificar que otras propiedades opcionales sean booleanas
  const optionalProps = ["create", "edit", "delete"];
  for (const prop of optionalProps) {
    if (prop in section && typeof section[prop] !== "boolean") {
      return false;
    }
  }

  return true;
}
