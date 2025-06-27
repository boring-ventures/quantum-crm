"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, Target, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsAnalyticsOverviewProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToId?: string;
  };
}

interface OverviewData {
  totalLeads: number;
  previousPeriodLeads: number;
  percentageChange: number;
  conversionRate: number;
  topSource: {
    name: string;
    count: number;
  };
  qualificationBreakdown: Array<{
    qualification: string;
    count: number;
    percentage: string;
  }>;
}

async function fetchOverviewData(filters: any): Promise<OverviewData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);

  const response = await fetch(
    `/api/reports/leads-analytics/overview?${params}`
  );
  if (!response.ok) throw new Error("Error fetching overview data");

  const result = await response.json();
  return result.data;
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  colorScheme = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: any;
  colorScheme?: "blue" | "green" | "purple" | "orange";
}) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-lg",
            colorScheme === "blue" && "bg-blue-100 dark:bg-blue-900/30",
            colorScheme === "green" && "bg-green-100 dark:bg-green-900/30",
            colorScheme === "purple" && "bg-purple-100 dark:bg-purple-900/30",
            colorScheme === "orange" && "bg-orange-100 dark:bg-orange-900/30"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              colorScheme === "blue" && "text-blue-600 dark:text-blue-400",
              colorScheme === "green" && "text-green-600 dark:text-green-400",
              colorScheme === "purple" &&
                "text-purple-600 dark:text-purple-400",
              colorScheme === "orange" && "text-orange-600 dark:text-orange-400"
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <Badge
              variant={isPositiveTrend ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24 mb-2" />
            <div className="flex items-center">
              <Skeleton className="h-4 w-12 mr-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LeadsAnalyticsOverview({
  filters,
}: LeadsAnalyticsOverviewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leads-overview", filters],
    queryFn: () => fetchOverviewData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar métricas generales
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total de Leads"
        value={data.totalLeads.toLocaleString()}
        subtitle="en el período seleccionado"
        trend={{
          value: data.percentageChange,
          label: "vs período anterior",
        }}
        icon={Users}
        colorScheme="blue"
      />

      <KPICard
        title="Tasa de Conversión"
        value={`${data.conversionRate}%`}
        subtitle="leads calificados como buenos"
        icon={Target}
        colorScheme="green"
      />

      <KPICard
        title="Fuente Principal"
        value={data.topSource.name}
        subtitle={`${data.topSource.count} leads generados`}
        icon={Award}
        colorScheme="purple"
      />

      <KPICard
        title="Leads Calificados"
        value={
          data.qualificationBreakdown.find(
            (q) => q.qualification === "GOOD_LEAD"
          )?.count || 0
        }
        subtitle={`${
          data.qualificationBreakdown.find(
            (q) => q.qualification === "GOOD_LEAD"
          )?.percentage || 0
        }% del total`}
        icon={TrendingUp}
        colorScheme="orange"
      />
    </div>
  );
}
