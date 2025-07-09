"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, BarChart2, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Data {
  revenue: number;
  salesCount: number;
  avgTicket: number;
  conversionRate: number;
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface SalesOverviewProps {
  filters: any;
}

export function SalesOverview({ filters }: SalesOverviewProps) {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: Data }>(
    {
      queryKey: ["sales-overview", filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.countryIds?.length)
          params.append("countryIds", filters.countryIds.join(","));
        if (filters.assignedToIds?.length)
          params.append("assignedToIds", filters.assignedToIds.join(","));
        const res = await fetch(
          `/api/reports/sales-performance/overview?${params}`
        );
        if (!res.ok) throw new Error("Error fetching overview");
        return res.json();
      },
    }
  );

  if (isLoading || !data?.success) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Ingresos"
        value={`$${stats.revenue.toLocaleString()}`}
        icon={DollarSign}
        color="text-green-600"
      />
      <KPICard
        title="# Ventas"
        value={stats.salesCount.toString()}
        icon={BarChart2}
        color="text-blue-600"
      />
      <KPICard
        title="Ticket Promedio"
        value={`$${stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        icon={TrendingUp}
        color="text-purple-600"
      />
      <KPICard
        title="Conversion"
        value={`${stats.conversionRate.toFixed(1)}%`}
        icon={Percent}
        color="text-orange-600"
      />
    </div>
  );
}
