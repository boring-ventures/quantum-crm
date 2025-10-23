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
import { Filter, TrendingDown } from "lucide-react";

interface TeamFunnelChartProps {
  filters: any;
}

interface FunnelData {
  funnels: Array<{
    userId: string;
    name: string;
    stages: {
      leads: number;
      qualified: number;
      quotations: number;
      reservations: number;
      sales: number;
    };
    conversionRates: {
      leadToQualified: number;
      qualifiedToQuotation: number;
      quotationToReservation: number;
      reservationToSale: number;
    };
  }>;
}

async function fetchFunnelData(filters: any): Promise<FunnelData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.userIds?.length)
    params.append("userIds", filters.userIds.join(","));
  if (filters.role) params.append("role", filters.role);

  const response = await fetch(
    `/api/reports/team-analytics/funnel?${params}`
  );

  if (!response.ok) throw new Error("Error fetching funnel data");

  const result = await response.json();
  return result.data;
}

export function TeamFunnelChart({ filters }: TeamFunnelChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-funnel", filters],
    queryFn: () => fetchFunnelData(filters),
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
          <CardTitle>Embudo de Conversión del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error al cargar datos del embudo de conversión
          </p>
        </CardContent>
      </Card>
    );
  }

  const { funnels } = data;

  // Prepare chart data
  const chartData = funnels.map((item) => ({
    name: item.name,
    Leads: item.stages.leads,
    Calificados: item.stages.qualified,
    Cotizaciones: item.stages.quotations,
    Reservas: item.stages.reservations,
    Ventas: item.stages.sales,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600" />
          <CardTitle>Embudo de Conversión del Equipo</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Análisis de las etapas del proceso de venta por vendedor
        </p>
      </CardHeader>
      <CardContent>
        {/* Chart */}
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
            <Bar dataKey="Leads" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="Calificados" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Cotizaciones" stackId="a" fill="#10b981" />
            <Bar dataKey="Reservas" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Ventas" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>

        {/* Detailed Funnel Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Vendedor</th>
                <th className="text-center p-2">Leads</th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center">
                    <span>Calificados</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      (% conversión)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center">
                    <span>Cotizaciones</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      (% conversión)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center">
                    <span>Reservas</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      (% conversión)
                    </span>
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex flex-col items-center">
                    <span>Ventas</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      (% conversión)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {funnels.map((item) => (
                <tr key={item.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{item.name}</td>
                  <td className="text-center p-2">{item.stages.leads}</td>
                  <td className="text-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">
                        {item.stages.qualified}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {item.conversionRates.leadToQualified}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">
                        {item.stages.quotations}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {item.conversionRates.qualifiedToQuotation}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">
                        {item.stages.reservations}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {item.conversionRates.quotationToReservation}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.stages.sales}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {item.conversionRates.reservationToSale}%
                      </span>
                    </div>
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
