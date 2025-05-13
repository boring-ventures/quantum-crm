import {
  Command,
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  User,
  CalendarCheck,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
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
        },
        {
          title: "Leads",
          url: "/leads",
          icon: User,
        },
        {
          title: "Ventas",
          url: "/ventas",
          icon: ShoppingCart,
        },
        {
          title: "Reportes",
          url: "/reportes",
          icon: BarChart3,
        },
        {
          title: "Tareas",
          url: "/tareas",
          icon: CalendarCheck,
        },
        {
          title: "Usuarios",
          url: "/users",
          icon: Users,
        },
      ],
    },
  ],
};
<<<<<<< HEAD

// Función para filtrar elementos del sidebar basado en permisos
export function filterSidebarByPermissions(
  canViewSection: (key: string) => boolean
): SidebarData {
  console.log("[sidebar-data] Iniciando filtro de sidebar por permisos");

  // Si la función canViewSection no es válida, devolver datos estáticos
  if (typeof canViewSection !== "function") {
    console.log(
      "[sidebar-data] canViewSection no es una función válida, usando datos estáticos"
    );
    return { ...sidebarDataStatic };
  }

  const filteredData = { ...sidebarDataStatic };

  // Filtrar los grupos de navegación
  filteredData.navGroups = filteredData.navGroups
    .map((group) => {
      console.log(`[sidebar-data] Procesando grupo: ${group.title}`);

      // Filtrar elementos en cada grupo
      const filteredItems = group.items.filter((item) => {
        try {
          // Asegurarse de que key existe
          const itemKey = item.key || "";
          console.log(`[sidebar-data] Verificando permiso para: ${itemKey}`);

          // Para secciones con estructura anidada como "admin.roles"
          if (item.parentKey) {
            // Verificar si tiene permiso para el elemento parent
            const parentHasAccess = canViewSection(item.parentKey);
            console.log(
              `[sidebar-data] Permiso para ${item.parentKey}: ${parentHasAccess}`
            );

            // Verificar si tiene permiso para el elemento anidado
            const fullKey = `${item.parentKey}.${itemKey}`;
            const itemHasAccess = canViewSection(fullKey);
            console.log(
              `[sidebar-data] Permiso para ${fullKey}: ${itemHasAccess}`
            );

            // Mostrar el elemento si tiene acceso al padre o al elemento específico
            const hasAccess = parentHasAccess || itemHasAccess;
            console.log(
              `[sidebar-data] Acceso final para ${item.title}: ${hasAccess}`
            );
            return hasAccess;
          }

          const hasAccess = canViewSection(itemKey);
          console.log(
            `[sidebar-data] Acceso para ${item.title} (${itemKey}): ${hasAccess}`
          );
          return hasAccess;
        } catch (error) {
          console.error(
            `[sidebar-data] Error al filtrar elemento ${item.title}:`,
            error
          );
          return false;
        }
      });

      console.log(
        `[sidebar-data] Grupo ${group.title}: ${filteredItems.length} elementos después del filtrado`
      );

      // Devolver el grupo sólo si aún tiene elementos después del filtrado
      return filteredItems.length > 0
        ? { ...group, items: filteredItems }
        : null;
    })
    .filter(Boolean) as typeof filteredData.navGroups;

  console.log(
    `[sidebar-data] Resultado final: ${filteredData.navGroups.length} grupos en el sidebar`
  );
  return filteredData;
}
=======
>>>>>>> parent of 2bfa236 (Merge pull request #4 from boring-ventures/users_section)
