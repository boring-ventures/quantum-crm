"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import type { DashboardMetricsResponse } from "@/types/metric-card";
import { LeadInterestChart } from "./lead-interest-chart";
import { NewLeadsCard } from "./new-leads-card";
import { PendingTasksCard } from "./pending-tasks-card";
import { SalesCard } from "./sales-card";
import { QuotationsCard } from "./quotations-card";
import { ReservationsCard } from "./reservations-card";

interface DashboardMetricsProps {
  metrics?: DashboardMetricsResponse;
}

// Función para mapear estados de cotizaciones a colores y nombres en español
const mapQuotationStatus = (status: string, count: number) => {
  switch (status) {
    case "DRAFT":
      return { status: "Borrador", count, color: "#6b7280" };
    case "COMPLETED":
      return { status: "Completada", count, color: "#10b981" };
    case "CANCELLED":
      return { status: "Cancelada", count, color: "#ef4444" };
    default:
      return { status, count, color: "#3b82f6" };
  }
};

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = (href: string, permissionKey: string) => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, permissionKey, "view")
    ) {
      router.push(href);
    } else {
      console.warn("Acceso denegado a la sección:", permissionKey);
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  // Ajustar la cuadrícula para menos columnas en pantallas grandes (ej. lg:grid-cols-3)
  // y el esqueleto de carga.
  const gridClasses = "grid gap-6 md:grid-cols-2 lg:grid-cols-3";

  if (!metrics) {
    return (
      <div className="space-y-6">
        {/* Esqueleto del gráfico de leads */}
        <div className="w-full">
          <Card className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-lg font-bold">Total Leads</CardTitle>
              <div className="h-7 w-7 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4">
              <div className="h-32 w-full bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Esqueleto de Leads Nuevos */}
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">
              Leads Nuevos
            </CardTitle>
            <div className="h-6 w-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>

        {/* Esqueleto de Tareas Pendientes */}
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">
              Tareas Pendientes
            </CardTitle>
            <div className="h-6 w-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>

        {/* Esqueleto de Ventas */}
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">Ventas</CardTitle>
            <div className="h-6 w-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>

        {/* Esqueleto de Cotizaciones */}
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">
              Cotizaciones
            </CardTitle>
            <div className="h-6 w-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>

        {/* Esqueleto de Reservas */}
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold">Reservas</CardTitle>
            <div className="h-6 w-6 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {/* Gráfico de interés de leads */}
      <LeadInterestChart
        data={{
          frio: Math.floor(metrics.totalLeads * 0.6), // 60% frío
          tibio: Math.floor(metrics.totalLeads * 0.2), // 20% tibio
          caliente: Math.floor(metrics.totalLeads * 0.2), // 20% caliente
          total: metrics.totalLeads,
        }}
      />

      {/* Leads Nuevos personalizado */}
      <NewLeadsCard value={metrics.newLeads} />

      {/* Tareas Pendientes personalizado */}
      <PendingTasksCard value={metrics.pendingTasks} />

      {/* Ventas con datos reales */}
      <SalesCard
        value={metrics.sales}
        monthlyGoal={150000}
        monthlySalesTotal={metrics.monthlySalesTotal}
      />

      {/* Cotizaciones con estados reales */}
      <QuotationsCard
        value={metrics.quotations}
        statuses={Object.entries(metrics.quotationStatuses).map(
          ([status, count]) => mapQuotationStatus(status, count)
        )}
        conversionRate={metrics.conversionRate}
      />

      {/* Reservas con próximas fechas reales */}
      <ReservationsCard
        value={metrics.reservations}
        upcomingReservations={metrics.upcomingReservations}
        confirmedRate={metrics.confirmedRate}
      />
    </div>
  );
}
