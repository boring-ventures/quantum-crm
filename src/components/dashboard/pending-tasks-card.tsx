"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import { ClipboardList, Flag } from "lucide-react";

interface PendingTasksCardProps {
  value: number;
}

export function PendingTasksCard({ value }: PendingTasksCardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "tasks", "view")
    ) {
      router.push("/tasks?status=pending");
    } else {
      console.warn("Acceso denegado a la sección: tasks");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "tasks", "view");

  // Simular progreso (67% como en la imagen)
  const progress = 67;
  const daysLeft = 4;

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
          Tareas Pendientes
        </CardTitle>
        <ClipboardList className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Acumuladas desde Abril 2025
        </p>

        {/* Barra de progreso */}
        <div className="w-full bg-muted rounded-full h-3 mb-3 relative overflow-hidden">
          <div
            className="bg-green-500 h-full rounded-full relative flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            <span className="text-white text-xs font-bold">{progress}%</span>
            {/* Persona saltando */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full relative">
                {/* Cabeza */}
                <div className="w-3 h-3 bg-yellow-400 rounded-full absolute -top-1 -left-0.5"></div>
                {/* Brazos levantados */}
                <div className="w-1 h-2 bg-yellow-400 absolute -top-2 -left-1 transform rotate-45"></div>
                <div className="w-1 h-2 bg-yellow-400 absolute -top-2 -right-1 transform -rotate-45"></div>
                {/* Piernas */}
                <div className="w-1 h-2 bg-purple-500 absolute -bottom-1 -left-0.5"></div>
                <div className="w-1 h-2 bg-purple-500 absolute -bottom-1 -right-0.5"></div>
                {/* Zapatos */}
                <div className="w-1.5 h-1 bg-white absolute -bottom-1.5 -left-0.5 rounded-full"></div>
                <div className="w-1.5 h-1 bg-white absolute -bottom-1.5 -right-0.5 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta mensual */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" />
          <span>Te faltan {daysLeft} días para llegar a tu meta mensual</span>
        </div>
      </CardContent>
    </Card>
  );
}
