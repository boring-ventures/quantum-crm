"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface LeadsTimelineChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToIds?: string[];
    leadCategory?: string;
  };
}

interface TimelineData {
  timeline: Array<{
    date: string;
    dateValue: string;
    goodLeads: number;
    badLeads: number;
    notQualified: number;
    total: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
}

async function fetchTimelineData(
  filters: any,
  groupBy: string
): Promise<TimelineData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.leadCategory && filters.leadCategory !== "all")
    params.append("leadCategory", filters.leadCategory);
  params.append("groupBy", groupBy);

  const response = await fetch(
    `/api/reports/leads-analytics/timeline?${params}`
  );
  if (!response.ok) throw new Error("Error fetching timeline data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload, label }: any) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = getChartAxisColors();

  if (active && payload && payload.length) {
    return (
      <div
        className="border rounded-lg shadow-lg p-3 max-w-xs"
        style={{ backgroundColor: axisColors.background }}
      >
        <p className="font-medium mb-2" style={{ color: axisColors.text }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            />
            <span style={{ color: axisColors.text }} className="opacity-70">
              {entry.name}:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {entry.value}
            </span>
          </div>
        ))}
        <div
          className="border-t mt-2 pt-2"
          style={{ borderColor: axisColors.grid }}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Total:
            </span>
            <span style={{ color: axisColors.text }}>
              {payload.reduce(
                (sum: number, entry: any) => sum + entry.value,
                0
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function TimelineChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

export function LeadsTimelineChart({ filters }: LeadsTimelineChartProps) {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const { getQualificationColors, getChartAxisColors } = useChartColors();

  const qualificationColors = useMemo(
    () => getQualificationColors(),
    [getQualificationColors]
  );
  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads-timeline", filters, groupBy],
    queryFn: () => fetchTimelineData(filters, groupBy),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <TimelineChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar datos temporales
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <CardTitle>Evolución Temporal de Leads</CardTitle>
          </div>
          <Select
            value={groupBy}
            onValueChange={(value) => {
              if (value === "day" || value === "week" || value === "month") {
                setGroupBy(value);
              }
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Diario</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data.timeline}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={axisColors.grid}
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
                color: axisColors.text,
              }}
            />
            <Line
              type="monotone"
              dataKey="goodLeads"
              stroke={qualificationColors.goodLeads}
              strokeWidth={3}
              dot={false}
              connectNulls={true}
              activeDot={{
                r: 6,
                stroke: qualificationColors.goodLeads,
                strokeWidth: 2,
                fill: axisColors.background,
              }}
              name="Leads Buenos"
            />
            <Line
              type="monotone"
              dataKey="badLeads"
              stroke={qualificationColors.badLeads}
              strokeWidth={3}
              dot={false}
              connectNulls={true}
              activeDot={{
                r: 6,
                stroke: qualificationColors.badLeads,
                strokeWidth: 2,
                fill: axisColors.background,
              }}
              name="Leads Malos"
            />
            <Line
              type="monotone"
              dataKey="notQualified"
              stroke={qualificationColors.notQualified}
              strokeWidth={3}
              dot={false}
              connectNulls={true}
              activeDot={{
                r: 6,
                stroke: qualificationColors.notQualified,
                strokeWidth: 2,
                fill: axisColors.background,
              }}
              name="No Calificados"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
