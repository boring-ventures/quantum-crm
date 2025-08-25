"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import {
  CalendarCheck,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

interface UpcomingReservation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  guests: number;
  status: "completed" | "draft" | "cancelled";
}

interface ReservationsCardProps {
  value: number;
  upcomingReservations: UpcomingReservation[];
  confirmedRate: number;
}

export function ReservationsCard({
  value,
  upcomingReservations,
  confirmedRate,
}: ReservationsCardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "sales", "view")
    ) {
      router.push("/sales?tab=reservas");
    } else {
      console.warn("Acceso denegado a la sección: sales");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "sales", "view");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "draft":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "draft":
        return <Clock className="h-3 w-3" />;
      case "cancelled":
        return <CalendarCheck className="h-3 w-3" />;
      default:
        return <CalendarCheck className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
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
          Reservas
        </CardTitle>
        <CalendarCheck className="h-6 w-6 text-purple-500" />
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        {/* Valor principal */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-1">
            {value}
          </div>
          <p className="text-xs text-muted-foreground">Total de reservas</p>
        </div>

        {/* Tasa de confirmación */}
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                Confirmadas
              </span>
            </div>
            <span className="text-lg font-bold text-purple-600">
              {confirmedRate}%
            </span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${confirmedRate}%` }}
            ></div>
          </div>
        </div>

        {/* Próximas reservas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-foreground">
              Próximas Reservas
            </span>
          </div>

          {upcomingReservations.slice(0, 3).map((reservation) => (
            <div key={reservation.id} className="p-2 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {reservation.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {reservation.clientName}
                  </span>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(reservation.status)}
                    <span>
                      {reservation.status === "completed"
                        ? "Completada"
                        : reservation.status === "draft"
                          ? "Borrador"
                          : "Cancelada"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  <span>
                    {formatDate(reservation.date)} - {reservation.time}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{reservation.guests} personas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
