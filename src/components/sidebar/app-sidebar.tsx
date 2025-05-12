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
import { TeamSwitcher } from "./team-switcher";
import {
  sidebarDataStatic,
  filterSidebarByPermissions,
} from "./data/sidebar-data";
import type { NavGroupProps } from "./types";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { useMemo, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { canViewSection, loading } = useRolePermissions();
  const [showSidebar, setShowSidebar] = useState(false);

  // Datos del sidebar filtrados por permisos
  const sidebarData = useMemo(() => {
    return filterSidebarByPermissions(canViewSection);
  }, [canViewSection]);

  // Esperar un breve momento antes de mostrar el sidebar para evitar parpadeos
  useEffect(() => {
    if (!loading) {
      // Solo mostrar el sidebar cuando los permisos estén cargados
      setShowSidebar(true);
    }
  }, [loading]);

  // Estructura compartida para ambos estados (cargando y cargado)
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarDataStatic.teams} />
      </SidebarHeader>
      <SidebarContent>
        {loading
          ? // Mostrar esqueletos durante la carga con la misma estructura que tendrá el sidebar
            sidebarDataStatic.navGroups.map((group, index) => (
              <div key={index} className="mb-6">
                <div className="mb-2 px-4">
                  <Skeleton className="h-5 w-24" />
                </div>
                {group.items.map((_, itemIndex) => (
                  <div key={itemIndex} className="mb-1 px-4 py-2">
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ))
          : // Mostrar los elementos filtrados cuando termine la carga
            sidebarData.navGroups.map((props: NavGroupProps) => (
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
