import {
  Command,
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  User,
  CalendarCheck,
  UserCog,
  Settings2,
  PackageSearch,
  Globe,
} from "lucide-react";
import type { SidebarData } from "../types";
import { hasPermission } from "@/lib/utils/permissions";

// Datos estáticos del sidebar
export const sidebarDataStatic: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Quantum CRM",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          key: "dashboard",
        },
        {
          title: "Leads",
          url: "/leads",
          icon: User,
          key: "leads",
        },
        {
          title: "Ventas y Reservas",
          url: "/sales",
          icon: ShoppingCart,
          key: "sales",
        },
        {
          title: "Reportes",
          url: "/reportes",
          icon: BarChart3,
          key: "reports",
        },
        {
          title: "Tareas",
          url: "/tasks",
          icon: CalendarCheck,
          key: "tasks",
        },
        {
          title: "Usuarios",
          url: "/users",
          icon: Users,
          key: "users",
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          title: "Roles y Permisos",
          url: "/admin/roles",
          icon: UserCog,
          key: "admin.roles",
          parentKey: "admin",
        },
        {
          title: "Leads",
          url: "/admin/leads",
          icon: Settings2,
          key: "admin.leads-settings",
          parentKey: "admin",
        },
        {
          title: "Productos",
          url: "/admin/products",
          icon: PackageSearch,
          key: "admin.products",
          parentKey: "admin",
        },
        {
          title: "Países",
          url: "/admin/countries",
          icon: Globe,
          key: "admin.countries",
          parentKey: "admin",
        },
      ],
    },
  ],
};

// Función para filtrar elementos del sidebar basado en permisos
export function filterSidebarByPermissions(user: any): SidebarData {
  const canViewSection = (sectionKey: string) =>
    hasPermission(user, sectionKey, "view");

  const filteredData = { ...sidebarDataStatic };

  // Filtrar los grupos de navegación
  filteredData.navGroups = filteredData.navGroups
    .map((group) => {
      // Filtrar elementos en cada grupo
      const filteredItems = group.items.filter((item) => {
        try {
          // Asegurarse de que key existe
          const itemKey = item.key || "";

          // Para secciones con estructura anidada como "admin.roles"
          if (item.parentKey) {
            // Verificar si tiene permiso para el elemento parent
            const parentHasAccess = canViewSection(item.parentKey);
            // Verificar si tiene permiso para el elemento anidado
            const itemHasAccess = canViewSection(
              `${item.parentKey}.${itemKey}`
            );

            // Mostrar el elemento si tiene acceso al padre o al elemento específico
            return parentHasAccess || itemHasAccess;
          }

          return canViewSection(itemKey);
        } catch (error) {
          console.error("Error al filtrar elemento del sidebar:", error);
          return false;
        }
      });

      // Devolver el grupo sólo si aún tiene elementos después del filtrado
      return filteredItems.length > 0
        ? { ...group, items: filteredItems }
        : null;
    })
    .filter(Boolean) as typeof filteredData.navGroups;

  return filteredData;
}
