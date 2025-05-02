import {
  Command,
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  User,
  CalendarCheck,
  UserCog,
} from "lucide-react";
import type { SidebarData } from "../types";

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
          title: "Ventas",
          url: "/ventas",
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
          url: "/tareas",
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
      ],
    },
  ],
};

// Función para filtrar elementos del sidebar basado en permisos
export function filterSidebarByPermissions(
  canViewSection: (key: string) => boolean
): SidebarData {
  // Si la función canViewSection no es válida, devolver datos estáticos
  if (typeof canViewSection !== "function") {
    return { ...sidebarDataStatic };
  }

  const filteredData = { ...sidebarDataStatic };

  // Filtrar los grupos de navegación
  filteredData.navGroups = filteredData.navGroups
    .map((group) => {
      // Filtrar elementos en cada grupo
      const filteredItems = group.items.filter((item) => {
        try {
          // Asegurarse de que key existe
          const itemKey = item.key || "";

          // Comprobar si el usuario tiene permisos para ver esta sección
          if (item.parentKey) {
            // Para elementos anidados, usar la notación con punto
            return canViewSection(`${item.parentKey}.${itemKey}`);
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
