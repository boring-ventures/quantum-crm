"use client";

import { useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";

export function DashboardContent() {
  const { user } = useUserStore();
  const [activeFilters, setActiveFilters] = useState({
    company: "all-companies",
    brand: "all-brands",
    business: "all-businesses",
  });

  // Consulta para métricas del dashboard
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics", user?.id, activeFilters],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: activeFilters,
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

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
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
      </div>

      <DashboardFilters
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

      <div>
        <DashboardMetrics metrics={metrics} />
      </div>
    </div>
  );
}
