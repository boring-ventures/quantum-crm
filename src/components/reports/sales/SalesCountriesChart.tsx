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
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { Globe } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface SalesCountriesChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    assignedToIds?: string[];
    currency?: string;
  };
}

interface CountriesData {
  countries: Array<{
    countryId: string;
    countryName: string;
    countryCode: string;
    revenue: number;
    salesCount: number;
  }>;
}

async function fetchCountriesData(filters: any): Promise<CountriesData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.currency) params.append("currency", filters.currency);

  const response = await fetch(
    `/api/reports/sales-performance/countries?${params}`
  );
  if (!response.ok) throw new Error("Error fetching countries data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload, label }: any) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = getChartAxisColors();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="border rounded-lg shadow-lg p-3 max-w-xs"
        style={{ backgroundColor: axisColors.background }}
      >
        <p className="font-medium mb-2" style={{ color: axisColors.text }}>
          {data.countryName} ({data.countryCode})
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ingresos:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              ${data.revenue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ventas:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.salesCount}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function CountriesChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

export function SalesCountriesChart({ filters }: SalesCountriesChartProps) {
  const { getColor, getChartAxisColors } = useChartColors();
  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);
  const primaryColor = useMemo(() => getColor("blue"), [getColor]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-countries", filters],
    queryFn: () => fetchCountriesData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <CountriesChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar datos de países
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.countries.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Ventas por País</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No hay datos de países disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle>Ventas por País</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data.countries}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={axisColors.grid}
              opacity={0.3}
            />
            <XAxis
              dataKey="countryCode"
              tick={{ fill: axisColors.text, fontSize: 12 }}
              tickMargin={8}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
            />
            <YAxis
              tick={{ fill: axisColors.text, fontSize: 12 }}
              tickMargin={8}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill={primaryColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
