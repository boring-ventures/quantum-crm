"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadsQuery } from "@/lib/hooks";
import type { LeadWithRelations } from "@/types/lead";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { QualifyLeadDialog } from "@/components/leads/qualify-lead-dialog";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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
}

function LeadCard({ lead, onLeadUpdated }: LeadCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQualifyDialog, setShowQualifyDialog] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Color del badge según el interés
  const getInterestColor = (interest?: string) => {
    switch (interest) {
      case "Alto":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50";
      case "Medio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50";
      case "Bajo":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const handleCardClick = () => {
    // Si el lead ya está calificado como bueno, ir directamente a la página de detalles
    if (lead.qualification === "GOOD_LEAD") {
      router.push(`/leads/${lead.id}`);
    } else {
      // Si no está calificado, mostrar el diálogo
      setShowQualifyDialog(true);
    }
  };

  const handleQualify = (isGoodLead: boolean) => {
    setShowQualifyDialog(false);

    if (isGoodLead) {
      // Si es un buen lead, redirigir a la página detallada del lead
      router.push(`/leads/${lead.id}`);
    } else {
      // Si es un bad lead, actualizar la data
      if (onLeadUpdated) {
        onLeadUpdated();
      }
    }
  };

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-4 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
        onClick={handleCardClick}
      >
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
                  className={`h-5 w-5 ml-2 ${
                    isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevenir que el clic se propague a la tarjeta
                    setIsFavorite(!isFavorite);
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {lead.source?.name} {lead.company ? `- ${lead.company}` : ""}
              </p>
              <div className="flex items-center mt-2">
                {lead.interest === "Alto" && (
                  <Badge className={getInterestColor(lead.interest)}>
                    Alto interés
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que el clic se propague a la tarjeta
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
                  JC
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Jorge Céspedes
              </span>
            </div>
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
                  Llamada de seguimiento
                </span>{" "}
                · 15:00
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Diálogo de calificación de lead */}
      <QualifyLeadDialog
        open={showQualifyDialog}
        onOpenChange={setShowQualifyDialog}
        lead={lead}
        onQualify={handleQualify}
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

interface LeadsListProps {
  filterBadLeads?: boolean;
}

export function LeadsList({ filterBadLeads = false }: LeadsListProps) {
  const { data, isLoading, isError } = useLeadsQuery();
  const queryClient = useQueryClient();

  const handleLeadUpdated = () => {
    // Invalidar la caché para refrescar la lista
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

  // Filtrar los bad leads y leads archivados si es necesario
  const filteredLeads = filterBadLeads
    ? data.items.filter(
        (lead) => lead.qualification !== "BAD_LEAD" && !lead.isArchived
      )
    : data.items;

  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">No se encontraron leads activos.</p>
        <p className="text-gray-500 text-sm mt-1">
          Todos los leads han sido marcados como Bad Leads o inactivos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredLeads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onLeadUpdated={handleLeadUpdated} />
      ))}
    </div>
  );
}
