"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Users } from "lucide-react";
import { TeamFilters } from "./TeamFilters";
import { TeamAnalyticsOverview } from "./TeamAnalyticsOverview";
import { TeamPerformanceChart } from "./TeamPerformanceChart";
import { TeamTimelineChart } from "./TeamTimelineChart";
import { TeamWorkloadChart } from "./TeamWorkloadChart";
import { TeamFunnelChart } from "./TeamFunnelChart";
import { TeamActivityChart } from "./TeamActivityChart";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface TeamAnalyticsDashboardProps {
  initialFilters?: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    userIds?: string[];
    role?: string;
  };
}

export function TeamAnalyticsDashboard({
  initialFilters,
}: TeamAnalyticsDashboardProps) {
  const [filters, setFilters] = useState(initialFilters || {});
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all team analytics queries
      await queryClient.invalidateQueries({ queryKey: ["team-analytics-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["team-performance"] });
      await queryClient.invalidateQueries({ queryKey: ["team-timeline"] });
      await queryClient.invalidateQueries({ queryKey: ["team-workload"] });
      await queryClient.invalidateQueries({ queryKey: ["team-funnel"] });
      await queryClient.invalidateQueries({ queryKey: ["team-activity"] });

      toast({
        title: "Datos actualizados correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar los datos",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.countryIds?.length)
        params.append("countryIds", filters.countryIds.join(","));
      if (filters.userIds?.length)
        params.append("userIds", filters.userIds.join(","));
      if (filters.role) params.append("role", filters.role);

      const response = await fetch(
        `/api/reports/team-analytics/export?${params}`
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch =
        contentDisposition && contentDisposition.match(/filename="?(.+)"?/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `team_analytics_${new Date().toISOString().split("T")[0]}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Exportación completada exitosamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting team analytics:", error);
      toast({
        title: "Error al exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Analytics
          </h1>
          <p className="text-muted-foreground">
            Análisis completo del desempeño y actividad del equipo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-start">
        <TeamFilters onFiltersChange={handleFiltersChange} />
      </div>

      {/* Overview Section */}
      <TeamAnalyticsOverview filters={filters} />

      {/* Performance Chart - Full Width */}
      <TeamPerformanceChart filters={filters} />

      {/* Timeline Chart - Full Width */}
      <TeamTimelineChart filters={filters} />

      {/* Two Column Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <TeamWorkloadChart filters={filters} />
        <TeamFunnelChart filters={filters} />
      </div>

      {/* Activity Chart - Full Width */}
      <TeamActivityChart filters={filters} />
    </div>
  );
}
