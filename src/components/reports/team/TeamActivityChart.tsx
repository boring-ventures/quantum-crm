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
} from "recharts";
import { Activity, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TeamActivityChartProps {
  filters: any;
}

interface ActivityData {
  activity: Array<{
    userId: string;
    name: string;
    totalComments: number;
    totalTasksCompleted: number;
    avgDailyActivity: number;
    lastActivityDate: string;
    activityScore: number;
  }>;
  teamActivity: {
    totalComments: number;
    totalInteractions: number;
    mostActiveDay: string;
    avgCommentsPerUser: number;
  };
}

async function fetchActivityData(filters: any): Promise<ActivityData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.userIds?.length)
    params.append("userIds", filters.userIds.join(","));
  if (filters.role) params.append("role", filters.role);

  const response = await fetch(
    `/api/reports/team-analytics/activity?${params}`
  );

  if (!response.ok) throw new Error("Error fetching activity data");

  const result = await response.json();
  return result.data;
}

export function TeamActivityChart({ filters }: TeamActivityChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-activity", filters],
    queryFn: () => fetchActivityData(filters),
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
          <CardTitle>Actividad del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error al cargar datos de actividad
          </p>
        </CardContent>
      </Card>
    );
  }

  const { activity, teamActivity } = data;

  // Prepare chart data
  const chartData = activity.map((item) => ({
    name: item.name,
    Comentarios: item.totalComments,
    "Tareas Completadas": item.totalTasksCompleted,
    "Puntuación de Actividad": item.activityScore,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <CardTitle>Actividad del Equipo</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Seguimiento de interacciones y actividad del equipo
        </p>
      </CardHeader>
      <CardContent>
        {/* Team-wide Activity Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Comentarios
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {teamActivity.totalComments}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Promedio: {teamActivity.avgCommentsPerUser.toFixed(1)} por usuario
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Total Interacciones
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {teamActivity.totalInteractions}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Comentarios + Tareas
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Día Más Activo
              </span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {teamActivity.mostActiveDay !== "N/A"
                ? format(new Date(teamActivity.mostActiveDay), "dd MMM yyyy", {
                    locale: es,
                  })
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="Comentarios" fill="#3b82f6" />
            <Bar dataKey="Tareas Completadas" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>

        {/* Activity Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Miembro</th>
                <th className="text-right p-2">Comentarios</th>
                <th className="text-right p-2">Tareas Completadas</th>
                <th className="text-right p-2">Actividad Diaria</th>
                <th className="text-right p-2">Puntuación</th>
                <th className="text-right p-2">Última Actividad</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => (
                <tr key={item.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{item.name}</td>
                  <td className="text-right p-2">{item.totalComments}</td>
                  <td className="text-right p-2">{item.totalTasksCompleted}</td>
                  <td className="text-right p-2">
                    {item.avgDailyActivity.toFixed(1)}
                  </td>
                  <td className="text-right p-2">
                    <span className="font-medium text-blue-600">
                      {item.activityScore}
                    </span>
                  </td>
                  <td className="text-right p-2 text-xs text-muted-foreground">
                    {item.lastActivityDate !== "N/A"
                      ? format(new Date(item.lastActivityDate), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Score Legend */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Puntuación de Actividad:</span>{" "}
            Calculada como (Comentarios × 1) + (Tareas Completadas × 2)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
