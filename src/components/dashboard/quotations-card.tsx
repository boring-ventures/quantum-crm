"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface QuotationStatus {
  status: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

interface QuotationsCardProps {
  value: number;
  statuses: QuotationStatus[];
  conversionRate: number;
}

export function QuotationsCard({
  value,
  statuses,
  conversionRate,
}: QuotationsCardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "sales", "view")
    ) {
      router.push("/sales?tab=cotizaciones");
    } else {
      console.warn("Acceso denegado a la sección: sales");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "sales", "view");

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "borrador":
        return <FileText className="h-3 w-3 text-gray-500" />;
      case "completada":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "cancelada":
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`
        ${
          canViewSection
            ? "cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out"
            : "opacity-60 cursor-not-allowed"
        }
        flex flex-col justify-between h-full bg-gradient-to-br from-background to-muted/10 border-2 border-border/30 hover:border-primary/30
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Cotizaciones
        </CardTitle>
        <FileText className="h-6 w-6 text-blue-500" />
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        {/* Valor principal */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">
            {value}
          </div>
          <p className="text-xs text-muted-foreground">Total de cotizaciones</p>
        </div>

        {/* Distribución por estado */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">
              Estado Actual
            </span>
          </div>

          {statuses.map((status) => (
            <div
              key={status.status}
              className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(status.status)}
                <span className="text-sm text-foreground">{status.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {status.count}
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tasa de conversión */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Tasa de Conversión
              </span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {conversionRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${conversionRate}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
