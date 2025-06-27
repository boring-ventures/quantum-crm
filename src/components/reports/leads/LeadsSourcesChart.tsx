"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { Filter, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChartColors, useSourceColors } from "@/lib/utils/chart-colors";

interface LeadsSourcesChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToId?: string;
  };
  onSourceFilter?: (sourceIds: string[]) => void;
}

interface SourcesData {
  sources: Array<{
    sourceId: string;
    name: string;
    category: string;
    count: number;
    percentage: number;
    color?: string;
    costPerSource?: number | null;
  }>;
  categories: Array<{
    name: string;
    count: number;
    percentage: string;
    sources: any[];
  }>;
  totalLeads: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

async function fetchSourcesData(filters: any): Promise<SourcesData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);

  const response = await fetch(
    `/api/reports/leads-analytics/sources?${params}`
  );
  if (!response.ok) throw new Error("Error fetching sources data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload }: any) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = getChartAxisColors();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="border rounded-lg shadow-lg p-3 min-w-[200px]"
        style={{ backgroundColor: axisColors.background }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.displayColor }}
          />
          <p className="font-medium" style={{ color: axisColors.text }}>
            {data.name}
          </p>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Leads:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.count}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Porcentaje:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.percentage}%
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Categoría:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.category}
            </span>
          </div>
          {data.costPerSource && (
            <div
              className="flex justify-between border-t pt-1"
              style={{ borderColor: axisColors.grid }}
            >
              <span style={{ color: axisColors.text }} className="opacity-70">
                Costo:
              </span>
              <span className="font-medium" style={{ color: axisColors.text }}>
                ${data.costPerSource}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function SourcesChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Skeleton className="h-80 w-full rounded-full" />
          </div>
          <div className="lg:w-1/3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourcesList({
  sources,
  sourceColors,
  onSourceFilter,
}: {
  sources: SourcesData["sources"];
  sourceColors: Map<string, string>;
  onSourceFilter?: (sourceIds: string[]) => void;
}) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const handleSourceClick = (sourceId: string) => {
    if (!onSourceFilter) return;

    const newSelected = selectedSources.includes(sourceId)
      ? selectedSources.filter((id) => id !== sourceId)
      : [...selectedSources, sourceId];

    setSelectedSources(newSelected);
    onSourceFilter(newSelected);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Fuentes Principales</h4>
        {selectedSources.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSources([]);
              onSourceFilter?.([]);
            }}
          >
            <Filter className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {sources.slice(0, 8).map((source) => (
          <div
            key={source.sourceId}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
              selectedSources.includes(source.sourceId)
                ? "bg-muted"
                : "hover:bg-muted/50"
            }`}
            onClick={() => handleSourceClick(source.sourceId)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: sourceColors.get(source.sourceId) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{source.name}</p>
              <p className="text-xs text-muted-foreground">{source.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium">{source.count}</p>
              <p className="text-xs text-muted-foreground">
                {source.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedSources.length > 0 && (
        <div className="pt-2 border-t">
          <Badge variant="secondary" className="text-xs">
            {selectedSources.length} fuente
            {selectedSources.length !== 1 ? "s" : ""} seleccionada
            {selectedSources.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}

export function LeadsSourcesChart({
  filters,
  onSourceFilter,
}: LeadsSourcesChartProps) {
  const { getChartAxisColors } = useChartColors();

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads-sources", filters],
    queryFn: () => fetchSourcesData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate consistent colors for sources
  const sourceColors = useSourceColors(
    data?.sources?.map((s) => ({ sourceId: s.sourceId, name: s.name })) || []
  );

  // Add display colors to data for charts
  const chartData = useMemo(() => {
    if (!data?.sources) return [];

    return data.sources.map((source) => ({
      ...source,
      displayColor: sourceColors.get(source.sourceId) || "#8884d8",
    }));
  }, [data?.sources, sourceColors]);

  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);

  if (isLoading) {
    return <SourcesChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar distribución por fuente
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Fuente</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No hay datos de fuentes disponibles
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
            <Target className="h-5 w-5 text-purple-600" />
            <CardTitle>Distribución por Fuente</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{data.totalLeads}</p>
            <p className="text-xs text-muted-foreground">Total de leads</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pie Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  dataKey="count"
                  animationBegin={0}
                  animationDuration={800}
                  stroke={axisColors.background}
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.sourceId}-${index}`}
                      fill={entry.displayColor}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: axisColors.text,
                    marginTop: "10px",
                  }}
                  formatter={(value: string, entry: any) => (
                    <span style={{ color: axisColors.text }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sources List */}
          <div className="lg:w-1/3">
            <SourcesList
              sources={data.sources}
              sourceColors={sourceColors}
              onSourceFilter={onSourceFilter}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
