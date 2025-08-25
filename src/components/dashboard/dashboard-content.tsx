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
    <div className="flex flex-col space-y-8">
      {/* Header mejorado */}
      <div className="flex items-center gap-3 pb-6 border-b border-border/50">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">Q</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Tablero de Gestión
        </h1>
      </div>

      {/* Métricas del dashboard */}
      <DashboardMetrics metrics={metrics?.data} />
    </div>
  );
}
