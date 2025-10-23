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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface TeamPerformanceChartProps {
  filters: any;
}

interface PerformanceData {
  userId: string;
  name: string;
  email: string;
  country: string;
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalQuotations: number;
  totalReservations: number;
  totalSales: number;
  totalRevenue: {
    BOB: number;
    USD: number;
    USDT: number;
  };
  activeTasks: number;
  completedTasks: number;
  avgResponseTime: number;
  totalComments: number;
}

async function fetchPerformanceData(filters: any): Promise<PerformanceData[]> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.userIds?.length)
    params.append("userIds", filters.userIds.join(","));
  if (filters.role) params.append("role", filters.role);

  const response = await fetch(
    `/api/reports/team-analytics/performance?${params}`
  );

  if (!response.ok) throw new Error("Error fetching performance data");

  const result = await response.json();
  return result.data.performance;
}

export function TeamPerformanceChart({ filters }: TeamPerformanceChartProps) {
  const [sortBy, setSortBy] = useState<string>("totalSales");

  const { data, isLoading, error } = useQuery({
    queryKey: ["team-performance", filters],
    queryFn: () => fetchPerformanceData(filters),
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
          <CardTitle>Performance del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error al cargar datos de performance
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort data based on selected metric
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy as keyof PerformanceData];
    const bValue = b[sortBy as keyof PerformanceData];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return bValue - aValue;
    }
    return 0;
  });

  // Prepare chart data
  const chartData = sortedData.map((item) => ({
    name: item.name,
    "Total Leads": item.totalLeads,
    "Leads Calificados": item.qualifiedLeads,
    "Leads Convertidos": item.convertedLeads,
    "Ventas": item.totalSales,
    "Tasa de Conversión": item.conversionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance del Equipo</CardTitle>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalSales">Ventas</SelectItem>
              <SelectItem value="totalLeads">Total Leads</SelectItem>
              <SelectItem value="conversionRate">Conversión</SelectItem>
              <SelectItem value="completedTasks">Tareas Completadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Comparación de métricas clave por vendedor
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
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
            <Bar dataKey="Total Leads" fill="#8b5cf6" />
            <Bar dataKey="Leads Calificados" fill="#3b82f6" />
            <Bar dataKey="Leads Convertidos" fill="#10b981" />
            <Bar dataKey="Ventas" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>

        {/* Performance Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Vendedor</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Conversión</th>
                <th className="text-right p-2">Ventas</th>
                <th className="text-right p-2">Ingresos</th>
                <th className="text-right p-2">Tareas</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr key={item.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.country}
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-2">{item.totalLeads}</td>
                  <td className="text-right p-2">
                    {item.conversionRate.toFixed(1)}%
                  </td>
                  <td className="text-right p-2">{item.totalSales}</td>
                  <td className="text-right p-2">
                    <div className="text-xs">
                      {item.totalRevenue.BOB > 0 && (
                        <div>BOB {item.totalRevenue.BOB.toLocaleString()}</div>
                      )}
                      {item.totalRevenue.USD > 0 && (
                        <div>USD {item.totalRevenue.USD.toLocaleString()}</div>
                      )}
                      {item.totalRevenue.USDT > 0 && (
                        <div>USDT {item.totalRevenue.USDT.toLocaleString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-2">
                    {item.completedTasks}/{item.activeTasks + item.completedTasks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
