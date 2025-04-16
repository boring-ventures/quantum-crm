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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function DashboardMetrics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Métricas Clave</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          value="209"
          label="Leads sin Gestión"
          icon={<UserX className="h-5 w-5" />}
          trend="+5%"
          trendIcon={<TrendingUp className="h-3 w-3" />}
          trendType="negative"
          color="amber"
          onClick={() => console.log("Clicked Leads sin Gestión")}
        />

        <MetricCard
          value="1"
          label="Leads sin Tarea"
          icon={<ClipboardList className="h-5 w-5" />}
          trend="-2%"
          trendIcon={<TrendingDown className="h-3 w-3" />}
          trendType="positive"
          color="red"
          onClick={() => console.log("Clicked Leads sin Tarea")}
        />

        <MetricCard
          value="863"
          label="Tareas Vencidas"
          icon={<AlertCircle className="h-5 w-5" />}
          trend="+12%"
          trendIcon={<TrendingUp className="h-3 w-3" />}
          trendType="negative"
          color="rose"
          onClick={() => console.log("Clicked Tareas Vencidas")}
        />

        <MetricCard
          value="172"
          label="Tareas para Hoy"
          icon={<Calendar className="h-5 w-5" />}
          trend="0%"
          trendIcon={null}
          trendType="neutral"
          color="blue"
          onClick={() => console.log("Clicked Tareas para Hoy")}
        />

        <MetricCard
          value="0.0%"
          label="Objetivo [#0]"
          icon={<Goal className="h-5 w-5" />}
          trend="-"
          trendIcon={null}
          trendType="neutral"
          color="gray"
          onClick={() => console.log("Clicked Objetivo")}
        />

        <MetricCard
          value=""
          label="Proyectado Ventas"
          icon={<LineChart className="h-5 w-5" />}
          chart={<SalesChart />}
          color="gray"
          onClick={() => console.log("Clicked Proyectado Ventas")}
        />
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
  // Map color to Tailwind classes
  const colorMap = {
    amber: "border-l-amber-500 bg-amber-900/30 text-amber-200",
    red: "border-l-red-500 bg-red-900/30 text-red-200",
    rose: "border-l-rose-500 bg-rose-900/30 text-rose-200",
    blue: "border-l-blue-500 bg-blue-900/30 text-blue-200",
    gray: "border-l-gray-500 bg-gray-900/30 text-gray-200",
    green: "border-l-green-500 bg-green-900/30 text-green-200",
  };

  const iconColorMap = {
    amber: "bg-amber-900/50 text-amber-200",
    red: "bg-red-900/50 text-red-200",
    rose: "bg-rose-900/50 text-rose-200",
    blue: "bg-blue-900/50 text-blue-200",
    gray: "bg-gray-900/50 text-gray-200",
    green: "bg-green-900/50 text-green-200",
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
                    ? "bg-red-900/50 text-red-200"
                    : trendType === "positive"
                      ? "bg-green-900/50 text-green-200"
                      : "bg-gray-900/50 text-gray-200"
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
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700/50">
            <span className="text-xs font-medium opacity-80">Ver Detalles</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-gray-700/50 transition-colors"
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
            "bg-gray-700 hover:bg-gray-600 w-1.5 rounded-t transition-colors",
            i === data.length - 1 && "bg-green-600 hover:bg-green-500"
          )}
        />
      ))}
    </div>
  );
}
