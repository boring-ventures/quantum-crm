"use client";

import { DashboardMetrics } from "./metric-cards";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Tablero de Gestión
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido al panel de control de gerencia, {user?.name}
        </p>
      </div>

      <div>
        <DashboardMetrics metrics={metrics?.data} />
      </div>
    </div>
  );
}
