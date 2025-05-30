import { useCurrentUser } from "@/hooks/use-current-user";
import { useMemo } from "react";
import { UserRole } from "@prisma/client";

// Tipo para scope de permisos por acción CRUD
export type PermissionScope = "self" | "team" | "all" | false;

// Tipos para la estructura principal de permisos
export type ModulePermissions = {
  view: PermissionScope;
  create: PermissionScope;
  edit: PermissionScope;
  delete: PermissionScope;
};

// Definición de la estructura completa de permisos
export type UserPermissionsStructure = {
  leads: ModulePermissions;
  sales: ModulePermissions;
  tasks: ModulePermissions;
  users: ModulePermissions;
  products: ModulePermissions;
  reports: ModulePermissions;
  quotations: ModulePermissions;
  reservations: ModulePermissions;
  // Otros módulos según se necesite
};

// Tipo de retorno completo para el hook
export type UserAccessResult = {
  // ID del país del usuario
  userCountryId: string | null;

  // Banderas de roles
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  isCountryAdmin: boolean;

  // Permisos generales para módulos
  canViewLeads: boolean;
  canCreateLead: boolean;
  canEditLead: boolean;
  canDeleteLead: boolean;

  canViewSales: boolean;
  canCreateSale: boolean;
  canEditSale: boolean;
  canDeleteSale: boolean;

  canViewTasks: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;

  canViewUsers: boolean;
  canManageUsers: boolean;

  canViewReports: boolean;

  // Alcances de permisos por módulo
  leadViewScope: PermissionScope;
  leadEditScope: PermissionScope;
  leadDeleteScope: PermissionScope;

  salesViewScope: PermissionScope;
  salesEditScope: PermissionScope;
  salesDeleteScope: PermissionScope;

  tasksViewScope: PermissionScope;
  tasksEditScope: PermissionScope;

  // Metadatos del usuario
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: UserRole | string | null;

  // Estado de carga
  isLoading: boolean;
  error: Error | null;

  // Función auxiliar para verificar permisos
  hasPermission: (module: string, action: string) => boolean;
  getScope: (module: string, action: string) => PermissionScope;
};

// Mapeo de roles a permisos predeterminados
const ROLE_PERMISSIONS: Record<string, Record<string, PermissionScope>> = {
  SUPERADMIN: {
    all: "all",
  },
  USER: {
    leads: "self",
    sales: "self",
    tasks: "self",
  },
};

/**
 * Hook para gestionar permisos y accesos de usuario
 * Reemplaza useUserRole con capacidades avanzadas de permisos y scopes
 */
export const useUserAccess = (): UserAccessResult => {
  // Usar el hook existente para obtener datos básicos del usuario
  const { user, profile, isLoading, error } = useCurrentUser();

  // En este hook, derivamos los permisos basados en el rol del usuario
  // ya que el profile no tiene permisos personalizados
  const permissions = useMemo(() => {
    if (!profile?.role) {
      return null;
    }

    // Determinamos permisos basados en el rol
    const roleStr = profile.role.toString();
    return ROLE_PERMISSIONS[roleStr] || null;
  }, [profile?.role]);

  // Extraer datos para el resultado final
  const result = useMemo(() => {
    // Valores predeterminados
    const defaultResult: UserAccessResult = {
      userCountryId: null,
      isAdmin: false,
      isSuperAdmin: false,
      isSeller: false,
      isManager: false,
      isCountryAdmin: false,

      canViewLeads: false,
      canCreateLead: false,
      canEditLead: false,
      canDeleteLead: false,

      canViewSales: false,
      canCreateSale: false,
      canEditSale: false,
      canDeleteSale: false,

      canViewTasks: false,
      canCreateTask: false,
      canEditTask: false,
      canDeleteTask: false,

      canViewUsers: false,
      canManageUsers: false,

      canViewReports: false,

      leadViewScope: false,
      leadEditScope: false,
      leadDeleteScope: false,

      salesViewScope: false,
      salesEditScope: false,
      salesDeleteScope: false,

      tasksViewScope: false,
      tasksEditScope: false,

      userId: null,
      userEmail: null,
      userName: null,
      userRole: null,

      isLoading,
      error,

      // Función para verificar un permiso específico
      hasPermission: (module, action) => false,
      getScope: (module, action) => false,
    };

    // Si no hay usuario o perfil o está cargando, devolver valores predeterminados
    if (!user || !profile || isLoading) {
      return defaultResult;
    }

    // Determinar roles basados en la información del perfil
    // Nota: El enum UserRole solo tiene USER y SUPERADMIN
    const userRole = profile.role;
    const roleName = profile.role.toString();

    // Banderas de roles basadas en string o enum
    const isSuperAdmin = userRole === UserRole.SUPERADMIN;
    const isAdmin = roleName === "ADMIN"; // String literal, no está en el enum
    const isSeller = roleName === "SELLER"; // String literal
    const isManager = roleName === "MANAGER"; // String literal
    const isCountryAdmin = roleName === "COUNTRYADMIN"; // String literal

    // No tenemos countryId en el perfil actual, así que lo dejamos como null
    // En una implementación real, esto vendría de otra fuente
    const userCountryId = null;

    // Función para verificar permisos específicos
    const hasPermission = (module: string, action: string): boolean => {
      // Super Admin siempre tiene todos los permisos
      if (isSuperAdmin) return true;

      // Si no hay permisos definidos, usar los predeterminados basados en roles
      if (!permissions) {
        if (isAdmin) return true;
        if (isCountryAdmin) return true;
        if (
          isManager &&
          ["leads", "sales", "tasks", "reports"].includes(module)
        )
          return true;
        if (isSeller && module === "leads") return true;

        return false;
      }

      // Verificar los permisos específicos en la estructura JSON
      const scope = getScope(module, action);
      return scope !== false;
    };

    // Función para obtener el alcance de un permiso
    const getScope = (module: string, action: string): PermissionScope => {
      // Super Admin siempre tiene acceso completo
      if (isSuperAdmin) return "all";

      // Si no hay permisos específicos, usar predeterminados basados en roles
      if (!permissions) {
        if (isAdmin) return "all";
        if (isCountryAdmin) return "team";
        if (
          isManager &&
          ["leads", "sales", "tasks", "reports"].includes(module)
        )
          return "team";
        if (isSeller && module === "leads") return "self";

        return false;
      }

      // Para permisos basados en roles, verificamos si el módulo tiene permisos
      if (permissions.all) {
        return permissions.all;
      }

      // Obtener permiso específico para el módulo
      return permissions[module] || false;
    };

    // Construir objeto de resultado con todos los permisos y alcances
    return {
      ...defaultResult,

      userCountryId,
      isAdmin,
      isSuperAdmin,
      isSeller,
      isManager,
      isCountryAdmin,

      // Banderas de permisos por módulo
      canViewLeads: hasPermission("leads", "view"),
      canCreateLead: hasPermission("leads", "create"),
      canEditLead: hasPermission("leads", "edit"),
      canDeleteLead: hasPermission("leads", "delete"),

      canViewSales: hasPermission("sales", "view"),
      canCreateSale: hasPermission("sales", "create"),
      canEditSale: hasPermission("sales", "edit"),
      canDeleteSale: hasPermission("sales", "delete"),

      canViewTasks: hasPermission("tasks", "view"),
      canCreateTask: hasPermission("tasks", "create"),
      canEditTask: hasPermission("tasks", "edit"),
      canDeleteTask: hasPermission("tasks", "delete"),

      canViewUsers: hasPermission("users", "view"),
      canManageUsers: hasPermission("users", "edit"),

      canViewReports: hasPermission("reports", "view"),

      // Alcances por módulo
      leadViewScope: getScope("leads", "view"),
      leadEditScope: getScope("leads", "edit"),
      leadDeleteScope: getScope("leads", "delete"),

      salesViewScope: getScope("sales", "view"),
      salesEditScope: getScope("sales", "edit"),
      salesDeleteScope: getScope("sales", "delete"),

      tasksViewScope: getScope("tasks", "view"),
      tasksEditScope: getScope("tasks", "edit"),

      // Metadatos de usuario
      userId: user.id || null,
      userEmail: user.email || null,
      userName:
        profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : user.email || null,
      userRole: profile.role,

      // Funciones auxiliares
      hasPermission,
      getScope,
    };
  }, [user, profile, isLoading, error, permissions]);

  return result;
};

export default useUserAccess;
