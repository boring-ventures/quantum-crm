import { ReportsMetrics } from "@/types/reports";

export const REPORTS_METRICS: ReportsMetrics = {
  leadsAnalytics: {
    id: "leads-analytics",
    title: "Leads Analytics",
    description:
      "Evolución temporal de leads, distribución por fuente, país y producto",
    iconName: "TrendingUp",
    route: "/reports/leads-analytics",
    colorTheme: "blue",
    gradientFrom: "from-blue-500/10",
    gradientTo: "to-blue-600/5",
    hoverShadow: "hover:shadow-blue-500/25",
  },
  salesPerformance: {
    id: "sales-performance",
    title: "Sales Performance",
    description:
      "Revenue timeline, productos top, métodos de pago y performance geográfico",
    iconName: "DollarSign",
    route: "/reports/sales-performance",
    colorTheme: "green",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-green-600/5",
    hoverShadow: "hover:shadow-green-500/25",
  },
  teamAnalytics: {
    id: "team-analytics",
    title: "Team Analytics",
    description:
      "Performance de vendedores, tiempos de respuesta y distribución de carga",
    iconName: "Users",
    route: "/reports/team-analytics",
    colorTheme: "purple",
    gradientFrom: "from-purple-500/10",
    gradientTo: "to-purple-600/5",
    hoverShadow: "hover:shadow-purple-500/25",
  },
  pipelineHealth: {
    id: "pipeline-health",
    title: "Pipeline Health",
    description:
      "Estados del pipeline, leads estancados y análisis de efectividad",
    iconName: "BarChart3",
    route: "/reports/pipeline-health",
    colorTheme: "orange",
    gradientFrom: "from-orange-500/10",
    gradientTo: "to-orange-600/5",
    hoverShadow: "hover:shadow-orange-500/25",
  },
};

export const getMetricByRoute = (route: string) => {
  return Object.values(REPORTS_METRICS).find(
    (metric) => metric.route.endsWith(route) || metric.id === route
  );
};

export const getValidMetricIds = (): string[] => {
  return Object.values(REPORTS_METRICS).map((metric) => metric.id);
};
