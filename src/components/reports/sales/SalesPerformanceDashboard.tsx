"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";
import { SalesFilters } from "./SalesFilters";
import { SalesTimelineChart } from "./SalesTimelineChart";
import { SalesProductsChart } from "./SalesProductsChart";
import { SalesPaymentMethodsChart } from "./SalesPaymentMethodsChart";
import { SalesCountriesChart } from "./SalesCountriesChart";
import { SalesOverview } from "./SalesOverview";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { exportAllSalesPerformance } from "@/lib/utils/export-utils";
import { SUPPORTED_CURRENCIES } from "@/lib/reports/config";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesPerformanceDashboardProps {
  initialFilters?: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    assignedToIds?: string[];
  };
}

interface OverviewData {
  overview: {
    totalRevenue: number;
    totalQuotations: number;
    totalReservations: number;
    totalSales: number;
    totalProcesses: number;
    avgTicket: number;
    conversionRate: number;
    convertedLeads: number;
  };
  byCurrency: Record<string, any>;
}

async function fetchOverviewData(filters: any): Promise<OverviewData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));

  const response = await fetch(
    `/api/reports/sales-performance/overview?${params}`
  );
  if (!response.ok) throw new Error("Error fetching overview data");

  const result = await response.json();
  return result.data;
}

export function SalesPerformanceDashboard({
  initialFilters,
}: SalesPerformanceDashboardProps) {
  const [filters, setFilters] = useState(initialFilters || {});
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["sales-overview", filters],
    queryFn: () => fetchOverviewData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchOverview();
      toast({
        title: "Datos actualizados correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar los datos",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      await exportAllSalesPerformance(filters);
      toast({
        title: "Exportación completada exitosamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting sales performance:", error);
      toast({
        title: "Error al exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Format overview data for the metrics cards
  const overviewMetrics = overviewData?.overview
    ? [
        {
          title: "Ingresos Totales",
          value: `$${Number(
            overviewData.overview.totalRevenue || 0
          ).toLocaleString()}`,
          icon: DollarSign,
          description: "Suma de cotizaciones, reservas y ventas",
          color: "text-green-600",
        },
        {
          title: "Procesos Totales",
          value: overviewData.overview.totalProcesses.toLocaleString(),
          icon: TrendingUp,
          description: `${overviewData.overview.totalQuotations} cotizaciones, ${overviewData.overview.totalReservations} reservas, ${overviewData.overview.totalSales} ventas`,
          color: "text-blue-600",
        },
        {
          title: "Ticket Promedio",
          value: `$${overviewData.overview.avgTicket.toLocaleString()}`,
          icon: Target,
          description: "Por proceso completado",
          color: "text-purple-600",
        },
        {
          title: "Tasa de Conversión",
          value: `${overviewData.overview.conversionRate.toFixed(1)}%`,
          icon: Users,
          description: `${overviewData.overview.convertedLeads} leads convertidos`,
          color: "text-orange-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Sales Performance</h1>
          <p className="text-muted-foreground">
            Cotizaciones, reservas y ventas por moneda
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-start">
        <SalesFilters onFiltersChange={handleFiltersChange} />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isOverviewLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          : overviewMetrics.map((metric) => (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Currency Breakdown */}
      {isOverviewLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        overviewData?.byCurrency && (
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Moneda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(overviewData.byCurrency).map(
                  ([currency, data]: [string, any]) => {
                    const currencyInfo =
                      SUPPORTED_CURRENCIES[
                        currency as keyof typeof SUPPORTED_CURRENCIES
                      ];

                    const formatCurrency = (amount: number) => {
                      return `${
                        currencyInfo?.symbol || "$"
                      }${amount.toLocaleString()}`;
                    };

                    return (
                      <div key={currency} className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">
                          {currency} ({currencyInfo?.name || currency})
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Cotizaciones:</span>
                            <span className="font-medium">
                              {data.quotations.count} (
                              {formatCurrency(data.quotations.amount)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reservas:</span>
                            <span className="font-medium">
                              {data.reservations.count} (
                              {formatCurrency(data.reservations.amount)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ventas:</span>
                            <span className="font-medium">
                              {data.sales.count} (
                              {formatCurrency(data.sales.amount)})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesTimelineChart filters={filters} />
        <SalesProductsChart filters={filters} />
        <SalesPaymentMethodsChart filters={filters} />
        <SalesCountriesChart filters={filters} />
      </div>
    </div>
  );
}
