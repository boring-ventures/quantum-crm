"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ClipboardList,
  Goal,
  LineChart,
  UserX,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  FileText,
  ShoppingCart,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardMetricsProps {
  metrics?: {
    totalLeads: number;
    leadsThisMonth: number;
    activeQuotations: number;
    completedSales: number;
    pendingTasks: number;
    overdueTasks: number;
  };
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const metricCards = [
    {
      title: "Total Leads",
      value: metrics?.totalLeads ?? 0,
      icon: Users,
      description: "Leads activos totales",
      color: "text-blue-600",
    },
    {
      title: "Leads Nuevos",
      value: metrics?.leadsThisMonth ?? 0,
      icon: UserPlus,
      description: "Leads este mes",
      color: "text-green-600",
    },
    {
      title: "Cotizaciones",
      value: metrics?.activeQuotations ?? 0,
      icon: FileText,
      description: "Cotizaciones activas",
      color: "text-purple-600",
    },
    {
      title: "Ventas",
      value: metrics?.completedSales ?? 0,
      icon: ShoppingCart,
      description: "Ventas completadas",
      color: "text-yellow-600",
    },
    {
      title: "Tareas Pendientes",
      value: metrics?.pendingTasks ?? 0,
      icon: CheckSquare,
      description: "Tareas por realizar",
      color: "text-orange-600",
    },
    {
      title: "Tareas Vencidas",
      value: metrics?.overdueTasks ?? 0,
      icon: AlertTriangle,
      description: "Tareas atrasadas",
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Métricas Clave</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{metric.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.description}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface MetricCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  trend?: string;
  trendIcon?: React.ReactNode | null;
  trendType?: "positive" | "negative" | "neutral";
  color: "amber" | "red" | "rose" | "blue" | "gray" | "green";
  chart?: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({
  value,
  label,
  icon,
  trend,
  trendIcon,
  trendType = "neutral",
  color,
  chart,
  onClick,
}: MetricCardProps) {
  // Map colors for both dark and light modes
  const colorMap = {
    amber:
      "border-l-amber-500 dark:bg-amber-900/30 dark:text-amber-200 bg-amber-100 text-amber-900",
    red: "border-l-red-500 dark:bg-red-900/30 dark:text-red-200 bg-red-100 text-red-900",
    rose: "border-l-rose-500 dark:bg-rose-900/30 dark:text-rose-200 bg-rose-100 text-rose-900",
    blue: "border-l-blue-500 dark:bg-blue-900/30 dark:text-blue-200 bg-blue-100 text-blue-900",
    gray: "border-l-gray-500 dark:bg-gray-900/30 dark:text-gray-200 bg-gray-100 text-gray-900",
    green:
      "border-l-green-500 dark:bg-green-900/30 dark:text-green-200 bg-green-100 text-green-900",
  };

  const iconColorMap = {
    amber:
      "dark:bg-amber-900/50 dark:text-amber-200 bg-amber-200 text-amber-900",
    red: "dark:bg-red-900/50 dark:text-red-200 bg-red-200 text-red-900",
    rose: "dark:bg-rose-900/50 dark:text-rose-200 bg-rose-200 text-rose-900",
    blue: "dark:bg-blue-900/50 dark:text-blue-200 bg-blue-200 text-blue-900",
    gray: "dark:bg-gray-900/50 dark:text-gray-200 bg-gray-200 text-gray-900",
    green:
      "dark:bg-green-900/50 dark:text-green-200 bg-green-200 text-green-900",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-0 shadow-sm cursor-pointer border-l-4",
          "hover:shadow-md transition-all duration-300",
          colorMap[color]
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={cn("p-1.5 rounded-md", iconColorMap[color])}>
              {icon}
            </div>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  trendType === "negative"
                    ? "dark:bg-red-900/50 dark:text-red-200 bg-red-200 text-red-900"
                    : trendType === "positive"
                      ? "dark:bg-green-900/50 dark:text-green-200 bg-green-200 text-green-900"
                      : "dark:bg-gray-900/50 dark:text-gray-200 bg-gray-200 text-gray-900"
                )}
              >
                {trendIcon}
                {trend}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {chart ? (
              chart
            ) : (
              <div className="text-2xl font-bold tracking-tighter">{value}</div>
            )}
            <div className="text-xs font-medium opacity-80">{label}</div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-gray-700/50 border-gray-300/50">
            <span className="text-xs font-medium opacity-80">Ver Detalles</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full dark:hover:bg-gray-700/50 hover:bg-gray-200/70 transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SalesChart() {
  const data = [40, 70, 60, 80, 65, 50, 30, 45];

  return (
    <div className="w-full h-[50px] flex items-end justify-center gap-1">
      {data.map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: i * 0.05,
          }}
          className={cn(
            "dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-300 hover:bg-gray-400 w-1.5 rounded-t transition-colors",
            i === data.length - 1 &&
              "dark:bg-green-600 dark:hover:bg-green-500 bg-green-500 hover:bg-green-600"
          )}
        />
      ))}
    </div>
  );
}
