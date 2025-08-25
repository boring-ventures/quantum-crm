"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import { DollarSign, Target, TrendingUp } from "lucide-react";

interface SalesCardProps {
  value: number;
  monthlyGoal: number;
  monthlySalesTotal: number;
}

export function SalesCard({
  value,
  monthlyGoal,
  monthlySalesTotal,
}: SalesCardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "sales", "view")
    ) {
      router.push("/sales?tab=ventas");
    } else {
      console.warn("Acceso denegado a la sección: sales");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "sales", "view");

  const progress = Math.min((value / monthlyGoal) * 100, 100);
  const remaining = Math.max(monthlyGoal - value, 0);

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
          Ventas
        </CardTitle>
        <DollarSign className="h-6 w-6 text-green-500" />
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        {/* Meta mensual y progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">
                Meta Mensual
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              ${monthlyGoal.toLocaleString()}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-muted rounded-full h-2 mb-2 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-green-500"></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Progreso: {progress.toFixed(1)}%
            </span>
            <span className="text-green-600 font-medium">
              ${value.toLocaleString()} / ${monthlyGoal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Resumen de Ventas del Mes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">
              Resumen del Mes
            </span>
          </div>

          <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700">
                Total Ventas
              </span>
              <span className="text-lg font-bold text-yellow-600">
                ${monthlySalesTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-yellow-600">
              <span>Transacciones: {value}</span>
              <span>
                Promedio: $
                {value > 0
                  ? (monthlySalesTotal / value).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Estado de la meta */}
        <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span className="text-blue-700 font-medium">
              {remaining > 0
                ? `Te faltan $${remaining.toLocaleString()} para alcanzar tu meta`
                : "¡Meta alcanzada! 🎉"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
