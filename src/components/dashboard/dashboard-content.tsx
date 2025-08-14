"use client";

import { DashboardMetrics } from "./metric-cards";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { Badge } from "@/components/ui/badge";
import { Info, Users, User, Shield } from "lucide-react";

export function DashboardContent() {
  const { user } = useUserStore();

  // Consulta para métricas del dashboard
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          countryId: user?.countryId,
        }),
      });
      if (!response.ok) {
        throw new Error("Error al cargar métricas");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Determinar el alcance de permisos del usuario
  const leadsScope = getScope(user, "leads", "view") || "self";
  const tasksScope = getScope(user, "tasks", "view") || "self";
  const salesScope = getScope(user, "sales", "view") || "self";

  // Función para obtener el texto descriptivo del alcance
  const getScopeDescription = (scope: string, resource: string) => {
    switch (scope) {
      case "all":
        return `Todas las ${resource} del sistema`;
      case "team":
        return `${resource} de tu equipo (mismo país)`;
      case "self":
        return `Solo tus ${resource} propias`;
      default:
        return `${resource} según tus permisos`;
    }
  };

  // Función para obtener el icono del alcance
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "all":
        return <Shield className="h-4 w-4" />;
      case "team":
        return <Users className="h-4 w-4" />;
      case "self":
        return <User className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Función para obtener el color del badge del alcance
  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case "all":
        return "default";
      case "team":
        return "secondary";
      case "self":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Tablero de Gestión
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido al panel de control de gerencia, {user?.name}
        </p>

        {/* Información sobre permisos y alcance */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  📊 Alcance de tus métricas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Las métricas que ves a continuación se muestran según tus
                  permisos y alcance en el sistema. Esto significa que los
                  números pueden variar dependiendo de tu rol y acceso.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getScopeBadgeVariant(leadsScope)}
                    className="text-xs"
                  >
                    {getScopeIcon(leadsScope)}
                    {leadsScope === "all"
                      ? "Global"
                      : leadsScope === "team"
                        ? "Equipo"
                        : "Personal"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Leads: {getScopeDescription(leadsScope, "leads")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={getScopeBadgeVariant(tasksScope)}
                    className="text-xs"
                  >
                    {getScopeIcon(tasksScope)}
                    {tasksScope === "all"
                      ? "Global"
                      : tasksScope === "team"
                        ? "Equipo"
                        : "Personal"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Tareas: {getScopeDescription(tasksScope, "tareas")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={getScopeBadgeVariant(salesScope)}
                    className="text-xs"
                  >
                    {getScopeIcon(salesScope)}
                    {salesScope === "all"
                      ? "Global"
                      : salesScope === "team"
                        ? "Equipo"
                        : "Personal"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Ventas: {getScopeDescription(salesScope, "ventas")}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                {leadsScope === "all" ? (
                  <>
                    <strong>💡 Nota importante:</strong> Tienes acceso global a
                    todos los datos del sistema. Las métricas muestran
                    información completa de leads, tareas y ventas.
                  </>
                ) : leadsScope === "team" ? (
                  <>
                    <strong>💡 Nota importante:</strong> Tienes acceso a los
                    datos de tu equipo. Las métricas incluyen información de
                    todos los miembros de tu país.
                  </>
                ) : (
                  <>
                    <strong>💡 Nota importante:</strong> Solo ves tus propios
                    datos asignados. Las métricas son personales y no incluyen
                    información de otros usuarios.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <DashboardMetrics metrics={metrics?.data} />
      </div>
    </div>
  );
}
