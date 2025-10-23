"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Clock, DollarSign, Target, CheckCircle } from "lucide-react";

interface TeamAnalyticsOverviewProps {
  filters: any;
}

interface OverviewData {
  overview: {
    totalTeamMembers: number;
    activeMembers: number;
    avgConversionRate: number;
    avgResponseTime: number;
    totalTeamRevenue: number;
    totalLeads: number;
    totalConvertedLeads: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
  };
  topPerformer: {
    userId: string;
    name: string;
    totalSales: number;
    conversionRate: number;
  } | null;
  workloadStats: {
    avgLeadsPerSeller: number;
    maxLeads: number;
    minLeads: number;
  };
}

async function fetchOverviewData(filters: any): Promise<OverviewData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.userIds?.length)
    params.append("userIds", filters.userIds.join(","));
  if (filters.role) params.append("role", filters.role);

  const response = await fetch(
    `/api/reports/team-analytics/overview?${params}`
  );

  if (!response.ok) throw new Error("Error fetching overview data");

  const result = await response.json();
  return result.data;
}

export function TeamAnalyticsOverview({
  filters,
}: TeamAnalyticsOverviewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-analytics-overview", filters],
    queryFn: () => fetchOverviewData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            Error al cargar los datos del overview
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overview, topPerformer, workloadStats } = data;

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Miembros del Equipo
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeMembers} activos
            </p>
          </CardContent>
        </Card>

        {/* Average Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversión Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.totalConvertedLeads} de {overview.totalLeads} leads
            </p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiempo de Respuesta
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.avgResponseTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio del equipo
            </p>
          </CardContent>
        </Card>

        {/* Total Team Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.totalTeamRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ventas aprobadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Task Completion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas Completadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.taskCompletionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.completedTasks} de {overview.totalTasks} tareas
            </p>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Carga Promedio
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workloadStats.avgLeadsPerSeller.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads por vendedor (max: {workloadStats.maxLeads})
            </p>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mejor Performance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topPerformer?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              ${topPerformer?.totalSales.toLocaleString() || "0"} en ventas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
