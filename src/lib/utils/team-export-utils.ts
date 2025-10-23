import { format } from "date-fns";

/**
 * Format team performance data for Excel export
 */
export function formatTeamPerformanceForExport(performanceData: any[]) {
  return performanceData.map((item) => ({
    "ID Usuario": item.userId,
    Nombre: item.name,
    Email: item.email,
    País: item.country,
    "Total Leads": item.totalLeads,
    "Leads Calificados": item.qualifiedLeads,
    "Leads Convertidos": item.convertedLeads,
    "Tasa de Conversión (%)": item.conversionRate.toFixed(2),
    "Total Cotizaciones": item.totalQuotations,
    "Total Reservas": item.totalReservations,
    "Total Ventas": item.totalSales,
    "Ingresos BOB": item.totalRevenue.BOB.toLocaleString(),
    "Ingresos USD": item.totalRevenue.USD.toLocaleString(),
    "Ingresos USDT": item.totalRevenue.USDT.toLocaleString(),
    "Tareas Activas": item.activeTasks,
    "Tareas Completadas": item.completedTasks,
    "Tiempo Promedio de Respuesta (hrs)": item.avgResponseTime.toFixed(2),
    "Total Comentarios": item.totalComments,
  }));
}

/**
 * Format team timeline data for Excel export
 */
export function formatTeamTimelineForExport(timelineData: any[]) {
  return timelineData.map((item) => ({
    Fecha: item.date,
    "Valor de Fecha": item.dateValue,
    "Nuevos Leads": item.newLeads,
    "Leads Convertidos": item.convertedLeads,
    "Tareas Creadas": item.tasksCreated,
    "Tareas Completadas": item.tasksCompleted,
    "Miembros Activos": item.activeMembers,
    "Ingresos Totales": item.totalRevenue.toLocaleString(),
  }));
}

/**
 * Format team workload data for Excel export
 */
export function formatTeamWorkloadForExport(workloadData: any[]) {
  return workloadData.map((item) => ({
    "ID Usuario": item.userId,
    Nombre: item.name,
    "Leads Activos": item.activeLeads,
    "Tareas Pendientes": item.pendingTasks,
    "Puntuación de Carga": item.workloadScore.toFixed(2),
    "Porcentaje (%)": item.percentage.toFixed(2),
  }));
}

/**
 * Format team funnel data for Excel export
 */
export function formatTeamFunnelForExport(funnelData: any[]) {
  return funnelData.map((item) => ({
    "ID Usuario": item.userId,
    Nombre: item.name,
    "Total Leads": item.stages.leads,
    "Leads Calificados": item.stages.qualified,
    Cotizaciones: item.stages.quotations,
    Reservas: item.stages.reservations,
    Ventas: item.stages.sales,
    "Conversión Lead → Calificado (%)": item.conversionRates.leadToQualified.toFixed(2),
    "Conversión Calificado → Cotización (%)": item.conversionRates.qualifiedToQuotation.toFixed(2),
    "Conversión Cotización → Reserva (%)": item.conversionRates.quotationToReservation.toFixed(2),
    "Conversión Reserva → Venta (%)": item.conversionRates.reservationToSale.toFixed(2),
  }));
}

/**
 * Format team activity data for Excel export
 */
export function formatTeamActivityForExport(activityData: any[]) {
  return activityData.map((item) => ({
    "ID Usuario": item.userId,
    Nombre: item.name,
    "Total Comentarios": item.totalComments,
    "Total Tareas Completadas": item.totalTasksCompleted,
    "Actividad Diaria Promedio": item.avgDailyActivity.toFixed(2),
    "Última Actividad": item.lastActivityDate !== "N/A"
      ? format(new Date(item.lastActivityDate), "dd/MM/yyyy HH:mm")
      : "N/A",
    "Puntuación de Actividad": item.activityScore,
  }));
}

/**
 * Format team overview data for Excel export (summary sheet)
 */
export function formatTeamOverviewForExport(overviewData: any) {
  const overview = overviewData.overview;
  const topPerformer = overviewData.topPerformer;
  const workloadStats = overviewData.workloadStats;

  return [
    { Métrica: "Total Miembros del Equipo", Valor: overview.totalTeamMembers },
    { Métrica: "Miembros Activos", Valor: overview.activeMembers },
    { Métrica: "Tasa de Conversión Promedio (%)", Valor: overview.avgConversionRate.toFixed(2) },
    { Métrica: "Tiempo de Respuesta Promedio (hrs)", Valor: overview.avgResponseTime.toFixed(2) },
    { Métrica: "Ingresos Totales del Equipo", Valor: overview.totalTeamRevenue.toLocaleString() },
    { Métrica: "Total Leads", Valor: overview.totalLeads },
    { Métrica: "Total Leads Convertidos", Valor: overview.totalConvertedLeads },
    { Métrica: "Total Tareas", Valor: overview.totalTasks },
    { Métrica: "Tareas Completadas", Valor: overview.completedTasks },
    { Métrica: "Tasa de Completación de Tareas (%)", Valor: overview.taskCompletionRate.toFixed(2) },
    { Métrica: "", Valor: "" },
    { Métrica: "Mejor Performance - Nombre", Valor: topPerformer?.name || "N/A" },
    { Métrica: "Mejor Performance - Ventas", Valor: topPerformer?.totalSales || 0 },
    { Métrica: "Mejor Performance - Conversión (%)", Valor: topPerformer?.conversionRate?.toFixed(2) || "0" },
    { Métrica: "", Valor: "" },
    { Métrica: "Leads Promedio por Vendedor", Valor: workloadStats.avgLeadsPerSeller.toFixed(1) },
    { Métrica: "Leads Máximo", Valor: workloadStats.maxLeads },
    { Métrica: "Leads Mínimo", Valor: workloadStats.minLeads },
  ];
}
