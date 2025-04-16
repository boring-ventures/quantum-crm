"use client";

import { useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { PortfolioManagement } from "@/components/dashboard/portfolio-management";
import { SalesRanking } from "@/components/dashboard/sales-ranking";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";

export function DashboardContent() {
  const [activeFilters, setActiveFilters] = useState({
    company: "all-companies",
    brand: "all-brands",
    branch: "all-branches",
    business: "all-businesses",
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
        <h1 className="text-xl font-semibold text-gray-100">
          Tablero de Gestión
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Bienvenido al panel de control de gerencia
        </p>
      </div>

      <DashboardFilters
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

      <div>
        <DashboardMetrics />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioManagement />
        <SalesRanking />
      </div>
    </div>
  );
}
