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
  todayTasks: number;
  quotations: number;
  sales: number;
  reservations: number;
}
