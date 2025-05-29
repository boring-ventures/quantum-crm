"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { NavGroupProps } from "./types";
import { useMemo, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarData } from "./hooks/use-sidebar-data";
import { TeamSwitcher } from "./team-switcher";
import { sidebarDataStatic } from "./data/sidebar-data";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUserStore();
  // Función para verificar permisos usando hasPermission
  const canViewSection = (sectionKey: string) =>
    hasPermission(user, sectionKey, "view");
  const {
    data: sidebarData,
    loading: sidebarLoading,
    error,
  } = useSidebarData();
  const [showSidebar, setShowSidebar] = useState(false);

  // Datos del sidebar filtrados por permisos
  const filteredSidebarData = useMemo(() => {
    if (!sidebarData || !canViewSection) return { navGroups: [] };

    console.log("[SIDEBAR] Filtrando datos del sidebar con permisos");
    console.log("[SIDEBAR] Grupos originales:", sidebarData);

    // Mostrar los iconos recibidos para depuración
    if (sidebarData.navGroups && sidebarData.navGroups.length > 0) {
      sidebarData.navGroups.forEach((group) => {
        group.items.forEach((item) => {
          console.log(`[SIDEBAR] Item: ${item.title}, Icon:`, item.icon);
        });
      });
    }

    // Filtrar grupos y sus elementos basándose en permisos
    const filteredGroups = sidebarData.navGroups
      .map((group) => {
        console.log(`[SIDEBAR] Procesando grupo: ${group.title}`);

        // Filtrar elementos de cada grupo según permisos
        const filteredItems = group.items.filter((item) => {
          // Si el elemento es un padre virtual (como admin), comprobar si al menos uno de sus hijos tiene permiso
          if (item.key === "admin" || (item as any)._isVirtualParent) {
            // Es un elemento padre virtual, verificar si se muestra basándose en los hijos
            if ("items" in item && item.items) {
              // Verificar si al menos un hijo tiene acceso
              const hasAccessToAnyChild = item.items.some((child) => {
                const childKey = child.key || "";
                const hasChildAccess = canViewSection(childKey);
                console.log(
                  `[SIDEBAR] Verificando acceso a hijo ${child.title} (${childKey}): ${hasChildAccess}`
                );
                return hasChildAccess;
              });

              console.log(
                `[SIDEBAR] Item padre: ${item.title}, Key: ${item.key}, Acceso a hijos: ${hasAccessToAnyChild}`
              );
              return hasAccessToAnyChild;
            }
          }

          // Si no es padre virtual, verificación normal de permisos
          const hasAccess = item.key ? canViewSection(item.key) : false;
          console.log(
            `[SIDEBAR] Item: ${item.title}, Key: ${item.key}, HasAccess: ${hasAccess}`
          );
          return hasAccess;
        });

        console.log(
          `[SIDEBAR] Items filtrados en ${group.title}: ${filteredItems.length}`
        );

        // Solo devolver grupos que tengan al menos un elemento
        return filteredItems.length > 0
          ? { ...group, items: filteredItems }
          : null;
      })
      .filter(Boolean) as NavGroupProps[];

    console.log("[SIDEBAR] Grupos filtrados:", filteredGroups.length);

    return {
      ...sidebarData,
      navGroups: filteredGroups,
    };
  }, [sidebarData, canViewSection]);

  // Esperar a que se carguen permisos y datos antes de mostrar
  const isLoading = sidebarLoading;

  // Mostrar el sidebar cuando los datos estén listos
  useEffect(() => {
    if (!isLoading) {
      setShowSidebar(true);
    }
  }, [isLoading]);

  if (error) {
    console.error("Error cargando datos del sidebar:", error);
  }

  // Estructura compartida para estados de carga y cargado
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarDataStatic.teams} />
      </SidebarHeader>
      <SidebarContent>
        {isLoading
          ? // Esqueletos durante la carga
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="mb-6">
                <div className="mb-2 px-4">
                  <Skeleton className="h-5 w-24" />
                </div>
                {Array.from({ length: 4 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="mb-1 px-4 py-2">
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ))
          : // Elementos filtrados cuando termine la carga
            filteredSidebarData.navGroups.map((props: NavGroupProps) => (
              <NavGroup key={props.title} {...props} />
            ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
