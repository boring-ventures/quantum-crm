"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TeamWorkloadChartProps {
  filters: any;
}

interface WorkloadData {
  distribution: Array<{
    userId: string;
    name: string;
    activeLeads: number;
    pendingTasks: number;
    workloadScore: number;
    percentage: number;
  }>;
  stats: {
    balanced: number;
    overloaded: number;
    underutilized: number;
    avgWorkload: number;
    totalWorkload: number;
  };
}

async function fetchWorkloadData(filters: any): Promise<WorkloadData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.userIds?.length)
    params.append("userIds", filters.userIds.join(","));
  if (filters.role) params.append("role", filters.role);

  const response = await fetch(
    `/api/reports/team-analytics/workload?${params}`
  );

  if (!response.ok) throw new Error("Error fetching workload data");

  const result = await response.json();
  return result.data;
}

function getWorkloadColor(
  workloadScore: number,
  avgWorkload: number
): string {
  const overloadedThreshold = avgWorkload * 1.3;
  const underutilizedThreshold = avgWorkload * 0.7;

  if (workloadScore >= overloadedThreshold) {
    return "#ef4444"; // red
  } else if (workloadScore <= underutilizedThreshold) {
    return "#f59e0b"; // orange
  } else {
    return "#10b981"; // green
  }
}

function getWorkloadStatus(
  workloadScore: number,
  avgWorkload: number
): { label: string; icon: JSX.Element; color: string } {
  const overloadedThreshold = avgWorkload * 1.3;
  const underutilizedThreshold = avgWorkload * 0.7;

  if (workloadScore >= overloadedThreshold) {
    return {
      label: "Sobrecargado",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-red-600",
    };
  } else if (workloadScore <= underutilizedThreshold) {
    return {
      label: "Subutilizado",
      icon: <TrendingDown className="h-4 w-4" />,
      color: "text-orange-600",
    };
  } else {
    return {
      label: "Balanceado",
      icon: <Minus className="h-4 w-4" />,
      color: "text-green-600",
    };
  }
}

export function TeamWorkloadChart({ filters }: TeamWorkloadChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-workload", filters],
    queryFn: () => fetchWorkloadData(filters),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Carga de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error al cargar datos de distribución de carga
          </p>
        </CardContent>
      </Card>
    );
  }

  const { distribution, stats } = data;

  // Safely get avgWorkload with fallback
  const avgWorkload = stats?.avgWorkload ?? 0;

  // Prepare chart data
  const chartData = distribution.map((item) => ({
    name: item.name,
    "Carga de Trabajo": item.workloadScore,
    "Leads Activos": item.activeLeads,
    "Tareas Pendientes": item.pendingTasks,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          <CardTitle>Distribución de Carga de Trabajo</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Análisis de carga de trabajo y balance del equipo
        </p>
      </CardHeader>
      <CardContent>
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Balanceados
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.balanced}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Carga óptima
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                Sobrecargados
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.overloaded}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              +30% sobre promedio
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Subutilizados
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.underutilized}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              -30% bajo promedio
            </p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="Carga de Trabajo" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => {
                const originalData = distribution[index];
                const color = getWorkloadColor(
                  originalData.workloadScore,
                  avgWorkload
                );
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Workload Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Miembro</th>
                <th className="text-right p-2">Leads Activos</th>
                <th className="text-right p-2">Tareas Pendientes</th>
                <th className="text-right p-2">Puntuación</th>
                <th className="text-right p-2">% Carga</th>
                <th className="text-center p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((item) => {
                const status = getWorkloadStatus(
                  item.workloadScore,
                  avgWorkload
                );
                return (
                  <tr key={item.userId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="text-right p-2">{item.activeLeads}</td>
                    <td className="text-right p-2">{item.pendingTasks}</td>
                    <td className="text-right p-2 font-medium">
                      {item.workloadScore.toFixed(1)}
                    </td>
                    <td className="text-right p-2">{item.percentage.toFixed(2)}%</td>
                    <td className="text-center p-2">
                      <div
                        className={`flex items-center justify-center gap-1 ${status.color}`}
                      >
                        {status.icon}
                        <span className="text-xs">{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-medium">
                <td className="p-2">Promedio</td>
                <td className="text-right p-2">-</td>
                <td className="text-right p-2">-</td>
                <td className="text-right p-2">{avgWorkload.toFixed(1)}</td>
                <td className="text-right p-2">-</td>
                <td className="text-center p-2">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
