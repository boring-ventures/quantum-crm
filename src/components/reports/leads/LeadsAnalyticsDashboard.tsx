"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Link from "next/link";
import { LeadsAnalyticsOverview } from "./LeadsAnalyticsOverview";
import { LeadsTimelineChart } from "./LeadsTimelineChart";
import { LeadsSourcesChart } from "./LeadsSourcesChart";
import { LeadsCountriesChart } from "./LeadsCountriesChart";
import { LeadsProductsChart } from "./LeadsProductsChart";
import { LeadsFilters } from "./LeadsFilters";

interface MetricConfig {
  id: string;
  title: string;
  description: string;
  colorTheme: "blue" | "green" | "purple" | "orange";
  iconName: string;
  route: string;
  gradientFrom: string;
  gradientTo: string;
}

interface LeadsAnalyticsDashboardProps {
  config: MetricConfig;
}

interface FiltersData {
  startDate?: string;
  endDate?: string;
  countryIds?: string[];
  sourceIds?: string[];
  assignedToId?: string;
}

export function LeadsAnalyticsDashboard({
  config,
}: LeadsAnalyticsDashboardProps) {
  const [filters, setFilters] = useState<FiltersData>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFiltersChange = useCallback((newFilters: FiltersData) => {
    setFilters(newFilters);
  }, []);

  const handleSourceFilter = useCallback((sourceIds: string[]) => {
    setFilters((prev) => ({ ...prev, sourceIds }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    console.log("Export functionality not yet implemented");
  }, []);

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Reportes
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-xl transition-colors duration-300",
                config.colorTheme === "blue" &&
                  "bg-blue-100 dark:bg-blue-900/30",
                config.colorTheme === "green" &&
                  "bg-green-100 dark:bg-green-900/30",
                config.colorTheme === "purple" &&
                  "bg-purple-100 dark:bg-purple-900/30",
                config.colorTheme === "orange" &&
                  "bg-orange-100 dark:bg-orange-900/30"
              )}
            >
              <div className="h-8 w-8" /> {/* Icon placeholder */}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {config.title}
                </h1>
                <Badge
                  variant="default"
                  className="text-xs bg-green-600 hover:bg-green-700"
                >
                  Fase 2 - Activo
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                {config.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
              />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content Area - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* KPI Overview */}
          <LeadsAnalyticsOverview filters={filters} />

          {/* Charts Grid */}
          <div className="grid gap-6">
            {/* Timeline Chart - Full width */}
            <LeadsTimelineChart filters={filters} />

            {/* Sources and Countries Charts - Side by side */}
            <div className="grid lg:grid-cols-2 gap-6">
              <LeadsSourcesChart
                filters={filters}
                onSourceFilter={handleSourceFilter}
              />
              <LeadsCountriesChart filters={filters} />
            </div>

            {/* Products Chart - Full width */}
            <LeadsProductsChart filters={filters} />
          </div>
        </div>

        {/* Filters Sidebar - 1 column */}
        <div className="lg:col-span-1">
          <LeadsFilters
            onFiltersChange={handleFiltersChange}
            className="lg:sticky lg:top-4"
          />
        </div>
      </div>

      {/* Footer Information */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Datos actualizados en tiempo real • Última actualización:{" "}
          {new Date().toLocaleString("es-ES")}
        </p>
      </div>
    </div>
  );
}
