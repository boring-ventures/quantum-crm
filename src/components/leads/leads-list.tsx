"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Star, Package, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLeadsQuery,
  useToggleFavoriteMutation,
  useLeadTasks,
  useLeadQuery,
  useUserRole,
} from "@/lib/hooks";
import type { LeadWithRelations } from "@/types/lead";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { hasPermission } from "@/lib/utils/permissions";

// Tipo para lead basado en el modelo de Prisma
export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: {
    id: string;
    name: string;
  };
  status?: {
    id: string;
    name: string;
    color: string;
  };
  tags?: {
    id: string;
    name: string;
  }[];
  interest?: string;
  createdAt: string;
  updatedAt: string;
};

interface LeadCardProps {
  lead: LeadWithRelations;
  onLeadUpdated?: () => void;
  currentUser: any;
}

function LeadCard({ lead, onLeadUpdated, currentUser }: LeadCardProps) {
  const canReadLeads = hasPermission(currentUser, "leads", "view");
  const canUpdateLeads = hasPermission(currentUser, "leads", "edit");

  const { data: updatedLead, isLoading: isLoadingUpdatedLead } = useLeadQuery(
    lead.id
  );
  const [isFavorite, setIsFavorite] = useState(lead.isFavorite || false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const { data: tasks } = useLeadTasks(lead.id);
  const queryClient = useQueryClient();

  // Actualizar el estado local cuando cambia la información del lead
  useEffect(() => {
    if (updatedLead) {
      setIsFavorite(updatedLead.isFavorite || false);
    }
  }, [updatedLead]);

  // Encontrar la próxima tarea pendiente
  const nextTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    return tasks
      .filter((task) => task.status === "PENDING" && task.scheduledFor)
      .sort((a, b) => {
        const dateA = new Date(a.scheduledFor as string);
        const dateB = new Date(b.scheduledFor as string);
        return dateA.getTime() - dateB.getTime();
      })[0];
  }, [tasks]);

  // Manejar el clic fuera para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Color del badge según el qualityScore
  const getQualityScoreColor = (score?: number) => {
    switch (score) {
      case 3:
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50";
      case 2:
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50";
      case 1:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  // Texto según el qualityScore
  const getQualityScoreText = (score?: number) => {
    switch (score) {
      case 3:
        return "Alto";
      case 2:
        return "Medio";
      case 1:
        return "Bajo";
      default:
        return "No definido";
    }
  };

  const handleCardClick = () => {
    // Siempre navegar al detalle del lead
    router.push(`/leads/${lead.id}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que el clic se propague a la tarjeta

    try {
      await toggleFavoriteMutation.mutateAsync({
        leadId: lead.id,
        isFavorite: !isFavorite,
      });

      // Actualizar el estado local inmediatamente
      setIsFavorite(!isFavorite);

      // Asegurar que el queryClient invalide todas las consultas relacionadas
      // para mantener la sincronización entre componentes
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      console.error("Error al cambiar estado de favorito:", error);
    }
  };

  // Renderizar las iniciales del nombre del usuario asignado
  const getUserInitials = () => {
    if (!lead.assignedTo) return "XX";

    const firstName = lead.assignedTo.name.split(" ")[0] || "";
    const lastName = lead.assignedTo.name.split(" ").slice(-1)[0] || "";

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Formatear la fecha/hora de una tarea programada
  const formatTaskTime = (dateString?: string | null) => {
    if (!dateString) return "No programada";

    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: es });
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-4 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer relative ${
          isLoadingUpdatedLead ? "opacity-50" : ""
        }`}
        onClick={handleCardClick}
      >
        {isLoadingUpdatedLead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-3">
            <Avatar className="h-14 w-14 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
              <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-lg">
                {lead.firstName.charAt(0)}
                {lead.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {lead.firstName} {lead.lastName}
                </h3>
                <Star
                  className={`h-5 w-5 ml-2 cursor-pointer ${
                    isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
                {lead.qualityScore && (
                  <Badge
                    className={`ml-2 ${getQualityScoreColor(lead.qualityScore)}`}
                  >
                    {getQualityScoreText(lead.qualityScore)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {lead.source?.name} {lead.company ? `- ${lead.company}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right relative" ref={dropdownRef}>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que el clic se propague a la tarjeta
                setShowDropdown(!showDropdown);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-more-vertical"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <ul className="py-1">
                  {canReadLeads && (
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          handleCardClick();
                        }}
                      >
                        Ver detalles
                      </button>
                    </li>
                  )}
                  {canUpdateLeads && (
                    <>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(false);
                            setShowEditDialog(true);
                          }}
                        >
                          Editar Lead
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(false);
                            handleToggleFavorite(e);
                          }}
                        >
                          {isFavorite
                            ? "Quitar de favoritos"
                            : "Marcar como favorito"}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center mr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDistanceToNow(new Date(lead.createdAt), { locale: es })}
          </div>
          {/* Producto asociado */}
          {lead.product && (
            <div className="flex items-center mr-4">
              <Package className="mr-1 h-4 w-4 text-blue-400 dark:text-blue-300" />
              <span className="text-gray-700 dark:text-gray-200">
                {typeof lead.product === "string"
                  ? lead.product
                  : typeof lead.product === "object" &&
                      lead.product !== null &&
                      "name" in lead.product
                    ? (lead.product as any).name
                    : ""}
              </span>
            </div>
          )}
          {/* Estado de calificación */}
          <div className="flex items-center mr-4">
            {lead.qualification === "GOOD_LEAD" ? (
              <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
            ) : lead.qualification === "BAD_LEAD" ? (
              <XCircle className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <HelpCircle className="mr-1 h-4 w-4 text-yellow-500" />
            )}
            <span className="text-gray-700 dark:text-gray-200">
              {lead.qualification === "GOOD_LEAD"
                ? "Calificado"
                : lead.qualification === "BAD_LEAD"
                  ? "Descartado"
                  : "Sin calificar"}
            </span>
          </div>
          {lead.phone && (
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {lead.phone}
            </div>
          )}
        </div>

        {lead.status && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 bg-gray-100 dark:bg-gray-700 mr-2 border border-gray-200 dark:border-gray-700">
                <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {lead.assignedTo?.name || "Sin asignar"}
              </span>
            </div>
            {nextTask && (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Próxima tarea:{" "}
                  <span className="text-gray-800 dark:text-gray-300">
                    {nextTask.title}
                  </span>{" "}
                  · {formatTaskTime(nextTask.scheduledFor)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de edición de lead */}
      <EditLeadDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        lead={lead}
      />
    </>
  );
}

function LeadCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-4">
      <div className="flex justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="mt-3">
        <div className="flex">
          <Skeleton className="h-4 w-32 mr-4" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

export interface LeadsListProps {
  filterBadLeads?: boolean;
  searchTerm?: string;
  filterType?:
    | "all"
    | "no-management"
    | "no-tasks"
    | "overdue-tasks"
    | "today-tasks"
    | "favorites"
    | "my-leads";
  interestLevel?: number;
  assignedToId?: string;
  countryId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  currentUser?: any;
  showSelectionColumn?: boolean;
  selectedLeads?: string[];
  onLeadSelect?: (leadId: string, isSelected: boolean) => void;
}

export function LeadsList({
  filterBadLeads = false,
  searchTerm = "",
  filterType = "all",
  interestLevel = 0,
  assignedToId,
  countryId,
  canEdit = false,
  canDelete = false,
  currentUser,
  showSelectionColumn = false,
  selectedLeads = [],
  onLeadSelect,
}: LeadsListProps) {
  const { data, isLoading, isError } = useLeadsQuery({
    assignedToId,
    countryId,
  });
  const queryClient = useQueryClient();

  const handleLeadUpdated = () => {
    // Invalida todas las consultas de leads para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400">Error al cargar los leads.</p>
        <p className="text-gray-500 text-sm mt-1">
          Intenta recargar la página.
        </p>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">No se encontraron leads.</p>
        <p className="text-gray-500 text-sm mt-1">
          Crea un nuevo lead para comenzar.
        </p>
      </div>
    );
  }

  // Paso 1: Filtrar los bad leads y leads archivados si es necesario
  let filteredLeads = filterBadLeads
    ? data.items.filter(
        (lead) => lead.qualification !== "BAD_LEAD" && !lead.isArchived
      )
    : data.items;

  // Paso 2: Aplicar filtro según el tipo seleccionado
  switch (filterType) {
    case "no-management":
      // Leads sin cotizaciones, ventas o reservas
      filteredLeads = filteredLeads.filter(
        (lead) =>
          (!lead.quotations || lead.quotations.length === 0) &&
          (!lead.reservations || lead.reservations.length === 0) &&
          (!lead.sales || lead.sales.length === 0)
      );
      break;
    case "no-tasks":
      // Leads sin tareas - Ahora usando tasks de la relación
      filteredLeads = filteredLeads.filter(
        (lead) => !lead.tasks || lead.tasks.length === 0
      );
      break;
    case "today-tasks":
      // Leads con tareas programadas para hoy - Ahora usando tasks de la relación
      filteredLeads = filteredLeads.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;

        return lead.tasks.some((task) => {
          if (!task.scheduledFor) return false;

          const today = new Date();
          const taskDate = new Date(task.scheduledFor);

          return (
            taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear() &&
            task.status === "PENDING"
          );
        });
      });
      break;
    case "overdue-tasks":
      // Leads con tareas vencidas - Ahora usando tasks de la relación
      filteredLeads = filteredLeads.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;

        return lead.tasks.some((task) => {
          if (!task.scheduledFor) return false;

          const today = new Date();
          const taskDate = new Date(task.scheduledFor);

          return taskDate < today && task.status === "PENDING";
        });
      });
      break;
    case "favorites":
      // Leads marcados como favoritos
      filteredLeads = filteredLeads.filter((lead) => lead.isFavorite);
      break;
    case "my-leads":
      // Leads asignados al usuario actual
      filteredLeads = filteredLeads.filter(
        (lead) => lead.assignedToId === assignedToId
      );
      break;
  }

  // Paso 3: Filtrar por nivel de interés si se especificó
  if (interestLevel > 0) {
    filteredLeads = filteredLeads.filter(
      (lead) => lead.qualityScore === interestLevel
    );
  }

  // Paso 4: Aplicar filtro de búsqueda por texto
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(
      (lead) =>
        lead.firstName.toLowerCase().includes(search) ||
        lead.lastName.toLowerCase().includes(search) ||
        (lead.email && lead.email.toLowerCase().includes(search)) ||
        (lead.phone && lead.phone.toLowerCase().includes(search)) ||
        (lead.company && lead.company.toLowerCase().includes(search))
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">
          No se encontraron leads que coincidan con los criterios.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Prueba con otros filtros o crea nuevos leads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        // Mostrar skeletons mientras carga
        Array.from({ length: 3 }).map((_, index) => (
          <LeadCardSkeleton key={index} />
        ))
      ) : filteredLeads.length === 0 ? (
        // Mostrar mensaje cuando no hay leads
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No hay leads disponibles</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            No se encontraron leads con los criterios actuales.
          </p>
        </div>
      ) : (
        // Mostrar lista de leads
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-4">
              {showSelectionColumn && (
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={(e) => onLeadSelect?.(lead.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                />
              )}
              <div className="flex-1">
                <LeadCard
                  lead={lead}
                  onLeadUpdated={handleLeadUpdated}
                  currentUser={currentUser}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
