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

  // Verificar si el lead está cerrado
  const isLeadClosed = lead.isClosed || lead.isArchived;

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

  // Verificar si el lead tiene tareas vencidas
  const hasOverdueTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return false;

    const now = new Date();
    return tasks.some((task) => {
      if (task.status === "COMPLETED") return false;
      if (!task.scheduledFor) return false;

      const taskDate = new Date(task.scheduledFor);
      return taskDate < now;
    });
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

  // Función para obtener el grado de interés con iconos y colores
  const getInterestLevel = (score?: number) => {
    switch (score) {
      case 3:
        return {
          text: "Caliente",
          icon: "🔥",
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconBg: "bg-orange-100",
        };
      case 2:
        return {
          text: "Tibio",
          icon: "🌡️",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconBg: "bg-yellow-100",
        };
      case 1:
        return {
          text: "Frío",
          icon: "❄️",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconBg: "bg-blue-100",
        };
      default:
        return {
          text: "Sin definir",
          icon: "❓",
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconBg: "bg-gray-100",
        };
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
        className={`bg-white dark:bg-gray-800 border-2 rounded-xl p-6 mb-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer relative overflow-hidden ${
          isLoadingUpdatedLead ? "opacity-50" : ""
        } ${
          hasOverdueTasks
            ? "border-red-500 dark:border-red-400"
            : "border-gray-200 dark:border-gray-700"
        }`}
        onClick={handleCardClick}
      >
        {/* Loading overlay */}
        {isLoadingUpdatedLead && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        {/* Header con avatar, nombre y acciones */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            {/* Avatar con gradiente */}
            <div className="relative">
              <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white dark:border-gray-700 shadow-lg">
                <AvatarFallback className="text-white text-xl font-bold">
                  {lead.firstName && lead.lastName
                    ? `${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`
                    : lead.firstName
                      ? lead.firstName.charAt(0)
                      : lead.lastName
                        ? lead.lastName.charAt(0)
                        : "NN"}
                </AvatarFallback>
              </Avatar>
              {/* Indicador de favorito */}
              <button
                onClick={!isLeadClosed ? handleToggleFavorite : undefined}
                className={`absolute -top-2 -right-2 p-1 rounded-full transition-all duration-200 ${
                  isLeadClosed
                    ? "cursor-default"
                    : "cursor-pointer hover:scale-110"
                } ${
                  isFavorite
                    ? "bg-yellow-400 text-yellow-800 shadow-lg"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                }`}
              >
                <Star className="h-4 w-4" />
              </button>
            </div>

            {/* Información del lead */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {lead.firstName && lead.lastName
                    ? `${lead.firstName} ${lead.lastName}`
                    : lead.firstName
                      ? lead.firstName
                      : lead.lastName
                        ? lead.lastName
                        : "Lead sin nombre"}
                </h3>

                {/* Grado de interés */}
                {lead.qualityScore && (
                  <div
                    className={`px-3 py-1.5 rounded-full border-2 ${getInterestLevel(lead.qualityScore).bgColor} ${getInterestLevel(lead.qualityScore).borderColor}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getInterestLevel(lead.qualityScore).icon}
                      </span>
                      <span
                        className={`text-sm font-semibold ${getInterestLevel(lead.qualityScore).color}`}
                      >
                        {getInterestLevel(lead.qualityScore).text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Canal/Fuente */}
              {lead.source?.name && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Canal: {lead.source.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Dropdown de acciones */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
                <ul className="py-1">
                  {canReadLeads && (
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        window.open(`/leads/${lead.id}`, "_blank");
                      }}
                    >
                      Abrir en nueva pestaña
                    </button>
                  </li>
                  {canUpdateLeads && !isLeadClosed && (
                    <>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

        {/* Información principal del lead */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Teléfono */}
          {lead.cellphone && (
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Teléfono
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {lead.cellphone}
                </p>
              </div>
            </div>
          )}

          {/* Producto */}
          {lead.product && (
            <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Producto
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {typeof lead.product === "string"
                    ? lead.product
                    : "name" in lead.product
                      ? (lead.product as any).name
                      : JSON.stringify(lead.product)}
                </p>
              </div>
            </div>
          )}

          {/* Fecha de creación */}
          <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Creado
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDistanceToNow(new Date(lead.createdAt), { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Usuario asignado */}
          <div className="flex items-center mb-3 lg:mb-0">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-gray-500 to-gray-600 mr-3 border-2 border-white dark:border-gray-700 shadow-md">
              <AvatarFallback className="text-white text-sm font-bold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Asignado a
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {lead.assignedTo?.name || "Sin asignar"}
              </p>
            </div>
          </div>

          {/* Próxima tarea */}
          {nextTask && (
            <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Próxima tarea
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {nextTask.title} · {formatTaskTime(nextTask.scheduledFor)}
                </p>
              </div>
            </div>
          )}
        </div>
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
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Info cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex items-center mb-3 lg:mb-0">
            <Skeleton className="h-10 w-10 rounded-full mr-3" />
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface LeadsListProps {
  filterType?: string;
  leadStatus?: "active" | "closed" | "archived";
  interestLevel?: number;
  searchTerm?: string;
  assignedToId?: string;
  countryId?: string;
  filterBadLeads?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  currentUser?: any;
  showSelectionColumn?: boolean;
  selectedLeads?: string[];
  onLeadSelect?: (leadId: string, selected: boolean) => void;
  page?: number;
  pageSize?: number;
}

export function LeadsList({
  filterType = "all",
  leadStatus = "active",
  interestLevel = 0,
  searchTerm = "",
  assignedToId,
  countryId,
  filterBadLeads = false,
  canEdit = false,
  canDelete = false,
  currentUser,
  showSelectionColumn = false,
  selectedLeads = [],
  onLeadSelect,
  page = 1,
  pageSize = 50,
}: LeadsListProps) {
  const { data, isLoading, error } = useLeadsQuery({
    search: searchTerm,
    assignedToId,
    countryId,
    page,
    pageSize,
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

  if (error) {
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
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <div className="flex flex-col items-center gap-2">
          <Package className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No hay leads disponibles
          </h3>
          <p className="text-gray-500 text-sm max-w-md">
            No se encontraron leads con los filtros de búsqueda actuales. Prueba
            ajustar los filtros o navegar a otra página.
          </p>
        </div>
      </div>
    );
  }

  // Paso 1: Filtrar por estado (activo, cerrado, archivado)
  let filteredLeads = data.items;

  switch (leadStatus) {
    case "active":
      filteredLeads = filteredLeads.filter(
        (lead) => !lead.isArchived && !lead.isClosed
      );
      break;
    case "closed":
      filteredLeads = filteredLeads.filter(
        (lead) => !lead.isArchived && lead.isClosed
      );
      break;
    case "archived":
      filteredLeads = filteredLeads.filter((lead) => lead.isArchived);
      break;
  }

  // Paso 2: Filtrar los bad leads si es necesario
  if (filterBadLeads) {
    filteredLeads = filteredLeads.filter(
      (lead) => lead.qualification !== "BAD_LEAD"
    );
  }

  // Paso 3: Aplicar filtro según el tipo seleccionado
  switch (filterType) {
    case "no-management":
      // Leads sin tareas y que no estén cerrados/archivados
      filteredLeads = filteredLeads.filter(
        (lead) =>
          (!lead.tasks || lead.tasks.length === 0) &&
          !lead.isClosed &&
          !lead.isArchived
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
    case "closed-leads":
      // Solo leads cerrados (ya filtrados por estado en el paso 1)
      break;
    case "my-leads":
      // Leads asignados al usuario actual
      filteredLeads = filteredLeads.filter(
        (lead) => lead.assignedToId === currentUser?.id
      );
      break;
    case "all":
    default:
      // Para el tab "all", ordenar para que los leads cerrados aparezcan al final
      if (leadStatus === "active") {
        filteredLeads = filteredLeads.sort((a, b) => {
          // Primero los leads activos, después los cerrados
          if (a.isClosed && !b.isClosed) return 1;
          if (!a.isClosed && b.isClosed) return -1;
          return 0;
        });
      }
      break;
  }

  // Paso 4: Filtrar por nivel de interés si se especificó
  if (interestLevel > 0) {
    filteredLeads = filteredLeads.filter(
      (lead) => lead.qualityScore === interestLevel
    );
  }

  // Paso 5: Aplicar filtro de búsqueda por texto
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(
      (lead) =>
        lead.firstName.toLowerCase().includes(search) ||
        lead.lastName.toLowerCase().includes(search) ||
        (lead.email && lead.email.toLowerCase().includes(search)) ||
        (lead.cellphone && lead.cellphone.toLowerCase().includes(search))
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <div className="flex flex-col items-center gap-2">
          <Package className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No hay leads en esta categoría
          </h3>
          <p className="text-gray-500 text-sm max-w-md">
            Los filtros de pestañas solo aplican a los {pageSize} leads cargados
            en esta página. Si buscas algo específico, prueba cambiar de página
            o usar la búsqueda por texto.
          </p>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
            💡 Tip: Los filtros solo aplican a los leads visibles en la página
            actual
          </div>
        </div>
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
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <div className="flex flex-col items-center gap-2">
            <Package className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              No hay leads disponibles
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              No se encontraron leads con los criterios actuales en esta página.
              Prueba navegar a otra página o ajustar los filtros.
            </p>
          </div>
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
