"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import {
  Users,
  UserPlus, // Icono más específico para nuevos leads
  ClipboardList,
  FileText,
  DollarSign,
  CalendarCheck,
} from "lucide-react";
import type {
  MetricCardData,
  DashboardMetricsResponse,
} from "@/types/metric-card";

interface DashboardMetricsProps {
  metrics?: DashboardMetricsResponse;
}

// Configuración de las tarjetas, ahora incluye descripción
const METRIC_CARDS_CONFIG: Omit<MetricCardData, "value">[] = [
  {
    id: "total-leads",
    title: "Total Leads",
    icon: Users,
    href: "/leads",
    permissionKey: "leads",
    description: "Todos los leads activos en el sistema.",
  },
  {
    id: "new-leads",
    title: "Leads Nuevos",
    icon: UserPlus,
    href: "/leads?status=new",
    permissionKey: "leads",
    description: "Leads generados en los últimos 7 días.",
  },
  {
    id: "pending-tasks",
    title: "Tareas Pendientes",
    icon: ClipboardList,
    href: "/tasks?status=pending",
    permissionKey: "tasks",
    description: "Tareas que requieren atención inmediata.",
  },
  {
    id: "quotations",
    title: "Cotizaciones",
    icon: FileText,
    href: "/quotations",
    permissionKey: "sales",
    description: "Cotizaciones activas y enviadas.",
  },
  {
    id: "sales",
    title: "Ventas",
    icon: DollarSign,
    href: "/sales",
    permissionKey: "sales",
    description: "Ventas concretadas en el mes actual.",
  },
  {
    id: "reservations",
    title: "Reservas",
    icon: CalendarCheck,
    href: "/reservations",
    permissionKey: "sales", // Ajustar si es necesario
    description: "Reservas confirmadas y pendientes.", // Placeholder, ajustar
  },
];

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
      <div className={gridClasses}>
        {METRIC_CARDS_CONFIG.map((config) => (
          <Card key={config.id} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                {config.title}
              </CardTitle>
              {config.icon && (
                <config.icon className="h-6 w-6 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricDataItems: MetricCardData[] = METRIC_CARDS_CONFIG.map(
    (config) => {
      let value: number | string = 0;
      switch (config.id) {
        case "total-leads":
          value = metrics.totalLeads;
          break;
        case "new-leads":
          value = metrics.newLeads;
          break;
        case "pending-tasks":
          value = metrics.pendingTasks;
          break;
        case "quotations":
          value = metrics.quotations;
          break;
        case "sales":
          value = metrics.sales;
          break;
        case "reservations":
          value = metrics.reservations;
          break;
        default:
          value = "N/A";
      }
      return { ...config, value };
    }
  );

  return (
    <div className={gridClasses}>
      {metricDataItems.map((item) => {
        const Icon = item.icon;
        const canViewSection =
          user &&
          user.userPermission &&
          hasPermission(
            user.userPermission.permissions,
            item.permissionKey,
            "view"
          );

        return (
          <Card
            key={item.id}
            onClick={() => handleCardClick(item.href, item.permissionKey)}
            className={`
              ${
                canViewSection
                  ? "cursor-pointer hover:shadow-xl transition-shadow duration-300 ease-in-out"
                  : "opacity-60 cursor-not-allowed"
              }
              flex flex-col justify-between h-full
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-base font-semibold text-foreground">
                {item.title}
              </CardTitle>
              {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
              <div className="text-4xl font-bold text-foreground mb-1">
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
