"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Globe, Users, TrendingUp } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface LeadsCountriesChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToId?: string;
  };
}

interface CountriesData {
  countries: Array<{
    countryId: string;
    name: string;
    code: string;
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    userCount: number;
    avgLeadsPerUser: string;
  }>;
  summary: {
    totalCountries: number;
    totalLeads: number;
    totalQualified: number;
    overallConversionRate: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

async function fetchCountriesData(filters: any): Promise<CountriesData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);

  const response = await fetch(
    `/api/reports/leads-analytics/countries?${params}`
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
        className="border rounded-lg shadow-lg p-3 min-w-[250px]"
        style={{ backgroundColor: axisColors.background }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-blue-600" />
          <p className="font-medium" style={{ color: axisColors.text }}>
            {data.name}
          </p>
          <Badge variant="outline" className="text-xs">
            {data.code}
          </Badge>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Total Leads:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.totalLeads}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Leads Calificados:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.qualifiedLeads}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Tasa Conversión:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.conversionRate}%
            </span>
          </div>
          <div
            className="border-t pt-1"
            style={{ borderColor: axisColors.grid }}
          >
            <div className="flex justify-between">
              <span style={{ color: axisColors.text }} className="opacity-70">
                Vendedores:
              </span>
              <span className="font-medium" style={{ color: axisColors.text }}>
                {data.userCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: axisColors.text }} className="opacity-70">
                Promedio por vendedor:
              </span>
              <span className="font-medium" style={{ color: axisColors.text }}>
                {data.avgLeadsPerUser}
              </span>
            </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}

function SummaryStats({ summary }: { summary: CountriesData["summary"] }) {
  return (
    <div className="flex gap-6 text-center">
      <div>
        <p className="text-2xl font-bold text-blue-600">
          {summary.totalCountries}
        </p>
        <p className="text-xs text-muted-foreground">Países</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-600">
          {summary.totalLeads.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">Total Leads</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-orange-600">
          {summary.overallConversionRate}%
        </p>
        <p className="text-xs text-muted-foreground">Conversión Promedio</p>
      </div>
    </div>
  );
}

export function LeadsCountriesChart({ filters }: LeadsCountriesChartProps) {
  const { getColor, getChartAxisColors } = useChartColors();

  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);
  const barColor = useMemo(() => getColor("blue"), [getColor]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads-countries", filters],
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
            Error al cargar performance por país
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por País</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Performance por País</CardTitle>
          </div>
          <SummaryStats summary={data.summary} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data.countries}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={axisColors.grid}
              opacity={0.3}
            />
            <XAxis
              type="number"
              tick={{ fill: axisColors.text, fontSize: 12 }}
              tickMargin={8}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: axisColors.text, fontSize: 12 }}
              tickMargin={8}
              width={100}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalLeads"
              fill={barColor}
              radius={[0, 4, 4, 0]}
              name="Total Leads"
              stroke={axisColors.background}
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Top Countries Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.countries.slice(0, 3).map((country, index) => (
            <div
              key={country.countryId}
              className="text-center p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {index === 0 && (
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium">{country.name}</span>
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads:</span>
                  <span className="font-medium">{country.totalLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversión:</span>
                  <span className="font-medium">{country.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedores:</span>
                  <span className="font-medium">{country.userCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
