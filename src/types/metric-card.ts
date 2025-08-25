export interface MetricCardData {
  id: string;
  title: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  href: string;
  permissionKey: string; // Clave para verificar permisos con hasPermission
  description: string; // Descripción para la tarjeta
}

export interface DashboardMetricsResponse {
  totalLeads: number;
  newLeads: number;
  pendingTasks: number;
  quotations: number;
  sales: number;
  reservations: number;
  // Datos adicionales para métricas dinámicas
  quotationStatuses: Record<string, number>;
  conversionRate: number;
  monthlySalesTotal: number;
  upcomingReservations: Array<{
    id: string;
    clientName: string;
    date: string;
    time: string;
    guests: number;
    status: "completed" | "draft" | "cancelled";
    amount: number;
  }>;
  confirmedRate: number;
}
