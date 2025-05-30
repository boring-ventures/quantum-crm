"use client";

import { useMemo, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  UserRound,
  Star,
  CheckCircle2,
  Clock,
  CalendarClock,
  Loader2,
  FileText,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeadWithRelations, Task } from "@/types/lead";
import { useLeadTasks } from "@/lib/hooks";

interface LeadTimelineProps {
  lead: LeadWithRelations;
  isFavorite?: boolean;
}

interface TimelineEvent {
  id: string;
  type:
    | "lead_created"
    | "task_created"
    | "lead_favorited"
    | "quotation_created"
    | "reservation_created"
    | "sale_created"
    | "lead_reassigned";
  date: Date;
  title: string;
  description: string;
  status?: string;
  statusColor?: string;
  amount?: number;
  paymentMethod?: string;
  fromUser?: string;
  toUser?: string;
  reassignedBy?: string;
}

export function LeadTimeline({ lead, isFavorite }: LeadTimelineProps) {
  // Estado local para manejar el estado de favorito
  const [localFavorite, setLocalFavorite] = useState(lead.isFavorite || false);

  // Actualizar estado local cuando cambie la prop
  useEffect(() => {
    setLocalFavorite(
      isFavorite !== undefined ? isFavorite : lead.isFavorite || false
    );
  }, [isFavorite, lead.isFavorite]);

  // Obtener tareas del lead usando el hook
  const { data: tasks, isLoading: tasksLoading } = useLeadTasks(lead.id);

  // Generar eventos para la línea de tiempo
  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    // Añadir evento de creación del lead
    allEvents.push({
      id: `lead-creation-${lead.id}`,
      type: "lead_created",
      date: new Date(lead.createdAt),
      title: "Lead creado",
      description: `Lead asignado a ${lead.assignedTo?.name || "Sin asignar"}`,
    });

    // Añadir eventos de tareas
    if (tasks && tasks.length > 0) {
      tasks.forEach((task: Task) => {
        allEvents.push({
          id: `task-creation-${task.id}`,
          type: "task_created",
          date: new Date(task.createdAt),
          title: "Nueva tarea creada",
          description: task.title,
          status: task.status,
          statusColor: getStatusColor(task.status),
        });
      });
    }

    // Añadir eventos de cotizaciones
    if (lead.quotations && lead.quotations.length > 0) {
      lead.quotations.forEach((quotation) => {
        const totalAmount =
          typeof quotation.totalAmount === "string"
            ? parseFloat(quotation.totalAmount)
            : quotation.totalAmount;

        allEvents.push({
          id: `quotation-${quotation.id}`,
          type: "quotation_created",
          date: new Date(quotation.createdAt),
          title: "Cotización creada",
          description: `Monto total: $${totalAmount.toFixed(2)}`,
          status: quotation.status,
          statusColor: getStatusColor(quotation.status),
          amount: totalAmount,
        });
      });
    }

    // Añadir eventos de reservas
    if (lead.reservations && lead.reservations.length > 0) {
      lead.reservations.forEach((reservation) => {
        const amount =
          typeof reservation.amount === "string"
            ? parseFloat(reservation.amount)
            : reservation.amount;

        allEvents.push({
          id: `reservation-${reservation.id}`,
          type: "reservation_created",
          date: new Date(reservation.createdAt),
          title: "Reserva creada",
          description: `Monto: $${amount.toFixed(2)} - Método: ${reservation.paymentMethod}`,
          status: reservation.status,
          statusColor: getStatusColor(reservation.status),
          amount: amount,
          paymentMethod: reservation.paymentMethod,
        });
      });
    }

    // Añadir eventos de ventas
    if (lead.sales && lead.sales.length > 0) {
      lead.sales.forEach((sale) => {
        const amount =
          typeof sale.amount === "string"
            ? parseFloat(sale.amount)
            : sale.amount;

        allEvents.push({
          id: `sale-${sale.id}`,
          type: "sale_created",
          date: new Date(sale.createdAt),
          title: "Venta realizada",
          description: `Monto: $${amount.toFixed(2)} - Método: ${sale.paymentMethod}`,
          status: sale.status,
          statusColor: getStatusColor(sale.status),
          amount: amount,
          paymentMethod: sale.paymentMethod,
        });
      });
    }

    // Añadir eventos de reasignación de leads
    if (lead.reassignments && lead.reassignments.length > 0) {
      lead.reassignments.forEach((reassignment) => {
        allEvents.push({
          id: `reassignment-${reassignment.id}`,
          type: "lead_reassigned",
          date: new Date(reassignment.createdAt),
          title: "Lead reasignado",
          description: `Reasignado por ${reassignment.reassignedByUser?.name || "Un usuario"}`,
          fromUser: reassignment.fromUser?.name,
          toUser: reassignment.toUser?.name,
          reassignedBy: reassignment.reassignedByUser?.name,
        });
      });
    }

    // Añadir evento de favorito solo si existe favoriteAt o si está marcado como favorito
    if (lead.isFavorite) {
      // Usar favoriteAt si existe, o updatedAt como respaldo
      const favoriteDate = lead.favoriteAt
        ? new Date(lead.favoriteAt)
        : new Date(lead.updatedAt);

      allEvents.push({
        id: `lead-favorited-${lead.id}`,
        type: "lead_favorited",
        date: favoriteDate,
        title: "Marcado como favorito",
        description: "Lead destacado para seguimiento prioritario",
      });
    }

    // Ordenar eventos por fecha (ascendente)
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [lead, tasks, localFavorite]);

  // Determinar el color del estado de la tarea
  function getStatusColor(status?: string): string {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  // Renderizar el icono adecuado según el tipo de evento
  function renderEventIcon(type: string) {
    switch (type) {
      case "lead_created":
        return <UserRound className="h-5 w-5 text-gray-500" />;
      case "task_created":
        return <CalendarClock className="h-5 w-5 text-blue-500" />;
      case "lead_favorited":
        return <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case "quotation_created":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "reservation_created":
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case "sale_created":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "lead_reassigned":
        return <ArrowRightLeft className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  }

  // Convertir el estado de la tarea a español
  function getStatusText(status?: string): string {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "IN_PROGRESS":
        return "En progreso";
      case "COMPLETED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      default:
        return "";
    }
  }

  if (!lead) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tasksLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">
          Cargando línea de tiempo...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Línea de Tiempo
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay eventos para mostrar en la línea de tiempo
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="mt-1">{renderEventIcon(event.type)}</div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {event.title}
                  </h4>
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {format(event.date, "dd/MM/yyyy, HH:mm:ss", { locale: es })}
                  </time>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>

                {event.status && (
                  <Badge className={`mt-1 font-normal ${event.statusColor}`}>
                    {getStatusText(event.status)}
                  </Badge>
                )}

                {event.type === "lead_reassigned" && (
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">De:</span>{" "}
                    {event.fromUser || "Usuario anterior"}
                    <span className="mx-2">→</span>
                    <span className="font-medium">A:</span>{" "}
                    {event.toUser || "Nuevo usuario"}
                    {event.reassignedBy && (
                      <span className="ml-2">
                        (por{" "}
                        <span className="font-semibold">
                          {event.reassignedBy}
                        </span>
                        )
                      </span>
                    )}
                  </div>
                )}

                {event.amount && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Monto: ${event.amount.toFixed(2)}
                    {event.paymentMethod && ` - Método: ${event.paymentMethod}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
