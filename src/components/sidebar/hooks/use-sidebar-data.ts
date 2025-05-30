"use client";

import { useState, useEffect } from "react";
import type {
  SidebarData,
  NavItem,
  NavLink,
  NavCollapsible,
  NavGroup,
} from "../types";
import { sidebarDataStatic } from "../data/sidebar-data";
import { DashboardSection } from "@/types/dashboard";
import * as LucideIcons from "lucide-react";
import { useUserStore } from "@/store/userStore";

type UseSidebarDataResult = {
  data: SidebarData | null;
  loading: boolean;
  error: Error | null;
};

export function useSidebarData(): UseSidebarDataResult {
  const [data, setData] = useState<SidebarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSidebarData() {
      console.log("[PERMISSIONS] Iniciando fetchSidebarData");
      try {
        setLoading(true);

        // Obtener datos del sidebar desde la API
        const response = await fetch("/api/dashboard-sections");

        if (!response.ok) {
          console.log("[PERMISSIONS] Error al obtener secciones:", response);
          throw new Error(`Error al obtener secciones: ${response.status}`);
        }

        const apiData = await response.json();
        console.log("[PERMISSIONS] Permisos recibidos:", apiData);

        if (isMounted) {
          // Transformar datos de la API al formato SidebarData
          const formattedData: SidebarData = {
            // Mantener datos estáticos del usuario y equipos por ahora
            user: sidebarDataStatic.user,
            teams: sidebarDataStatic.teams,
            // Generar grupos de navegación a partir de los datos de la API
            navGroups: formatNavGroups(apiData.data || []),
          };

          setData(formattedData);
          setError(null);
        }
      } catch (err) {
        console.error("Error al obtener datos del sidebar:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
          // En caso de error, usar datos estáticos como fallback
          setData(sidebarDataStatic);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSidebarData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

// Función para transformar los datos de la API en grupos de navegación
function formatNavGroups(sections: DashboardSection[] = []): NavGroup[] {
  if (!sections.length) return sidebarDataStatic.navGroups;

  // Tipo para extender DashboardSection con campo opcional de agrupación
  type SectionWithGroup = DashboardSection & { groupTitle?: string };

  // Organizar secciones: primero las principales, luego sus hijos
  const mainSections = sections.filter(
    (section) => !section.parentKey
  ) as SectionWithGroup[];
  const childSections = sections.filter((section) => section.parentKey);

  // Identificar secciones padre que no tienen URL propia pero tienen hijos
  // (como "admin" que es padre pero no tiene una pantalla propia)
  const virtualParents = new Set<string>();
  childSections.forEach((child) => {
    if (child.parentKey) {
      // Si el padre no existe como una sección principal, agregarlo como virtual parent
      const parentExists = mainSections.some(
        (main) => main.key === child.parentKey
      );
      if (!parentExists) {
        virtualParents.add(child.parentKey);
      }
    }
  });

  console.log(
    "[SIDEBAR] Padres virtuales detectados:",
    Array.from(virtualParents)
  );

  // Agrupar secciones principales por su propiedad de agrupación
  const groupedSections = mainSections.reduce(
    (groups, section) => {
      // Determinar a qué grupo pertenece (podría venir de la API en el futuro)
      const groupTitle = section.groupTitle || "General";

      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }

      groups[groupTitle].push(section);
      return groups;
    },
    {} as Record<string, SectionWithGroup[]>
  );

  // Crear grupos adicionales para padres virtuales (como "admin")
  virtualParents.forEach((parentKey) => {
    // Buscar todos los hijos de este padre virtual
    const children = childSections.filter(
      (child) => child.parentKey === parentKey
    );

    // Solo crear un grupo si hay hijos
    if (children.length > 0) {
      // Determinar el nombre del grupo (para "admin" sería "Administración")
      let groupTitle = "Otros";

      // Mapeo de claves conocidas a nombres de grupo
      if (parentKey === "admin") {
        groupTitle = "Administración";
      }

      // Crear un item colapsable para el padre virtual
      const virtualParentSection: NavCollapsible = {
        title: groupTitle,
        icon: parentKey === "admin" ? LucideIcons.Settings2 : undefined,
        key: parentKey,
        items: children.map((child) => ({
          title: child.name,
          url: child.url,
          key: `${parentKey}.${child.key}`,
          parentKey: parentKey,
          icon: getIconComponent(child.icon),
        })),
      };

      // Si no existe el grupo, crearlo
      if (!groupedSections[groupTitle]) {
        groupedSections[groupTitle] = [];
      }

      // Agregar el padre virtual como un item del grupo
      groupedSections[groupTitle].push({
        id: parentKey,
        key: parentKey,
        name: groupTitle,
        url: "",
        icon: parentKey === "admin" ? "Settings2" : undefined,
        displayOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Propiedades adicionales para el padre virtual
        _isVirtualParent: true,
        _children: children,
      } as unknown as SectionWithGroup);
    }
  });

  // Convertir grupos a formato navGroups
  return Object.entries(groupedSections).map(([title, sections]) => {
    return {
      title,
      items: sections.map((section) => {
        // Si es un padre virtual, crear directamente un item colapsable
        if ((section as any)._isVirtualParent) {
          const children = (section as any)._children || [];
          const collapsible: NavCollapsible = {
            title: section.name,
            icon: getIconComponent(section.icon),
            key: section.key,
            items: children.map((child: DashboardSection) => ({
              title: child.name,
              url: child.url,
              key: `${section.key}.${child.key}`,
              parentKey: section.key,
              icon: getIconComponent(child.icon),
            })),
          };
          return collapsible;
        }

        // Encontrar subsecciones (hijos) de esta sección
        const subSections = childSections.filter(
          (child) => child.parentKey === section.key
        );

        // Si hay subsecciones, crear un item colapsable
        if (subSections.length > 0) {
          const collapsible: NavCollapsible = {
            title: section.name,
            icon: getIconComponent(section.icon),
            key: section.key,
            items: subSections.map((sub) => ({
              title: sub.name,
              url: sub.url,
              key: `${section.key}.${sub.key}`,
              parentKey: section.key,
              icon: getIconComponent(sub.icon),
            })),
          };
          return collapsible;
        }

        // Si no hay subsecciones, crear un link simple
        const link: NavLink = {
          title: section.name,
          url: section.url,
          icon: getIconComponent(section.icon),
          key: section.key,
        };
        return link;
      }),
    };
  });
}

// Función que convierte nombres de iconos a componentes
function getIconComponent(iconName?: string): any {
  if (!iconName) return undefined;

  // Registro para depuración
  console.log(`[ICONS] Intentando mapear icono: ${iconName}`);

  try {
    // Importar dinámicamente desde lucide-react
    const iconMap: Record<string, any> = {
      LayoutDashboard: LucideIcons.LayoutDashboard,
      Users: LucideIcons.Users,
      ShoppingCart: LucideIcons.ShoppingCart,
      BarChart3: LucideIcons.BarChart3,
      User: LucideIcons.User,
      CalendarCheck: LucideIcons.CalendarCheck,
      UserCog: LucideIcons.UserCog,
      Settings2: LucideIcons.Settings2,
      PackageSearch: LucideIcons.PackageSearch,
      Globe: LucideIcons.Globe,
      Landmark: LucideIcons.Landmark,
      CreditCard: LucideIcons.CreditCard,
      Building: LucideIcons.Building,
      FileSpreadsheet: LucideIcons.FileSpreadsheet,
      CircleDollarSign: LucideIcons.CircleDollarSign,
      Factory: LucideIcons.Factory,
      Command: LucideIcons.Command,
    };

    // Verificar si el nombre del icono existe en nuestro mapa
    if (iconMap[iconName]) {
      console.log(`[ICONS] Icono encontrado en mapa: ${iconName}`);
      return iconMap[iconName];
    }

    // Si no está en nuestro mapa, intentar obtenerlo directamente de Lucide
    const Icon = (LucideIcons as Record<string, any>)[iconName];

    if (Icon) {
      console.log(`[ICONS] Icono encontrado en Lucide: ${iconName}`);
      return Icon;
    }

    console.log(
      `[ICONS] ¡Advertencia! Icono no encontrado: ${iconName}, usando fallback`
    );
    return LucideIcons.HelpCircle; // Usar icono de ayuda como fallback
  } catch (error) {
    console.error(`[ICONS] Error al mapear icono ${iconName}:`, error);
    return LucideIcons.HelpCircle; // Fallback en caso de error
  }
}
