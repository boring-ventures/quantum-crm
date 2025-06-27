import { LucideIcon } from "lucide-react";

export interface MetricConfig {
  id: string;
  title: string;
  description: string;
  iconName: string;
  route: string;
  colorTheme: "blue" | "green" | "purple" | "orange";
  gradientFrom: string;
  gradientTo: string;
  hoverShadow: string;
}

export interface MetricConfigWithIcon extends Omit<MetricConfig, "iconName"> {
  icon: LucideIcon;
}

export interface ReportsMetrics {
  leadsAnalytics: MetricConfig;
  salesPerformance: MetricConfig;
  teamAnalytics: MetricConfig;
  pipelineHealth: MetricConfig;
}

export type MetricId = keyof ReportsMetrics;

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}
