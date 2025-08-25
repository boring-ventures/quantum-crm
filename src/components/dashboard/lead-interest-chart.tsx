"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import { Flame, ThermometerSun, Thermometer, Users } from "lucide-react";

interface LeadInterestData {
  frio: number;
  tibio: number;
  caliente: number;
  total: number;
}

interface LeadInterestChartProps {
  data?: LeadInterestData;
}

export function LeadInterestChart({ data }: LeadInterestChartProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "leads", "view")
    ) {
      router.push("/leads");
    } else {
      console.warn("Acceso denegado a la sección: leads");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  if (!data) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Total Leads</CardTitle>
          <Users className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="h-24 w-full bg-muted rounded mb-2"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "leads", "view");

  // Calcular porcentajes para el gráfico
  const frioPercentage = data.total > 0 ? (data.frio / data.total) * 100 : 0;
  const tibioPercentage = data.total > 0 ? (data.tibio / data.total) * 100 : 0;
  const calientePercentage =
    data.total > 0 ? (data.caliente / data.total) * 100 : 0;

  // Generar el SVG del gráfico de torta
  const radius = 30;
  const centerX = 40;
  const centerY = 40;

  let currentAngle = 0;

  const createArc = (percentage: number, color: string) => {
    if (percentage === 0) return null;

    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return (
      <path
        key={color}
        d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
    );
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`
        ${
          canViewSection
            ? "cursor-pointer hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105"
            : "opacity-60 cursor-not-allowed"
        }
        flex flex-col justify-between h-full bg-gradient-to-br from-background to-muted/20 border-2 border-border/50
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Total Leads
        </CardTitle>
        <Users className="h-6 w-6 text-primary" />
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <svg width="80" height="80" className="transform -rotate-90">
              {createArc(calientePercentage, "#f97316")}{" "}
              {/* Orange for Caliente */}
              {createArc(tibioPercentage, "#eab308")} {/* Yellow for Tibio */}
              {createArc(frioPercentage, "#3b82f6")} {/* Blue for Frío */}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {data.total}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-foreground">Caliente</span>
            </div>
            <span className="font-semibold text-foreground">
              {data.caliente}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ThermometerSun className="h-3 w-3 text-yellow-500" />
              <span className="text-foreground">Tibio</span>
            </div>
            <span className="font-semibold text-foreground">{data.tibio}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-blue-500" />
              <span className="text-foreground">Frío</span>
            </div>
            <span className="font-semibold text-foreground">{data.frio}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
