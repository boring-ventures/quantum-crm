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
import { useState } from "react";
import { CalendarDays } from "lucide-react";

interface LeadsTimelineChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToId?: string;
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
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);
  params.append("groupBy", groupBy);

  const response = await fetch(
    `/api/reports/leads-analytics/timeline?${params}`
  );
  if (!response.ok) throw new Error("Error fetching timeline data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Total:</span>
            <span>
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
          <Select value={groupBy} onValueChange={setGroupBy}>
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
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-muted-foreground text-xs"
              tickMargin={8}
            />
            <YAxis className="text-muted-foreground text-xs" tickMargin={8} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
            />
            <Line
              type="monotone"
              dataKey="goodLeads"
              stroke="hsl(var(--green-600))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--green-600))", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--green-600))",
                strokeWidth: 2,
              }}
              name="Leads Buenos"
            />
            <Line
              type="monotone"
              dataKey="badLeads"
              stroke="hsl(var(--red-500))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--red-500))", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--red-500))",
                strokeWidth: 2,
              }}
              name="Leads Malos"
            />
            <Line
              type="monotone"
              dataKey="notQualified"
              stroke="hsl(var(--orange-500))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--orange-500))", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--orange-500))",
                strokeWidth: 2,
              }}
              name="No Calificados"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
