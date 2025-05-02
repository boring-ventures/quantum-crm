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
import { useMemo } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { canViewSection, loading } = useRolePermissions();

  // Usar useMemo para filtrar los datos del sidebar solo cuando canViewSection o loading cambien
  const sidebarData = useMemo(() => {
    return loading
      ? sidebarDataStatic
      : filterSidebarByPermissions(canViewSection);
  }, [canViewSection, loading]);

  // Si la carga está en progreso, se podría mostrar un indicador o versión simplificada
  if (loading) {
    // Opcional: mostrar un loader o una versión reducida del sidebar
  }

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props: NavGroupProps) => (
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
