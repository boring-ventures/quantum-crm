"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadsQuery } from "@/lib/hooks";
import type { LeadWithRelations } from "@/types/lead";

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
}

function LeadCard({ lead }: LeadCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Color del badge según el interés
  const getInterestColor = (interest?: string) => {
    switch (interest) {
      case "Alto":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Bajo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-gray-700">
            <AvatarFallback className="bg-gray-700 text-gray-300">
              {lead.firstName.charAt(0)}
              {lead.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-100">
                {lead.firstName} {lead.lastName}
              </h3>
              {lead.interest && (
                <Badge
                  className={`ml-2 text-xs ${getInterestColor(lead.interest)}`}
                >
                  {lead.interest}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {lead.source?.name} {lead.company && `- ${lead.company}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <Star
            className={`h-5 w-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
          />
        </button>
      </div>

      {lead.status && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Estado:</span>
            <span
              className="text-sm font-medium text-gray-200"
              style={{ color: lead.status.color }}
            >
              {lead.status.name}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(lead.updatedAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}

function LeadCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="mt-4 border-t border-gray-700 pt-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function LeadsList() {
  const { data, isLoading, isError } = useLeadsQuery();

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

  return (
    <div className="space-y-4">
      {data.items.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
