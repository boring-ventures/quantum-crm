"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Lead = {
  id: string;
  nombre: string;
  apellido: string;
  origen?: string;
  campaña?: string;
  tags?: string[];
  gradoInteres?: string;
  lastContact?: string;
  nextTask?: {
    type: string;
    date: string;
  };
};

// Datos de ejemplo
const mockLeads: Lead[] = [
  {
    id: "1",
    nombre: "Carlos",
    apellido: "Mendoza",
    origen: "Facebook",
    campaña: "Campaña Q4",
    gradoInteres: "Alto",
    lastContact: "2 horas",
    nextTask: {
      type: "Llamada de seguimiento",
      date: "15:00",
    },
  },
  {
    id: "2",
    nombre: "María",
    apellido: "López",
    origen: "WhatsApp",
    campaña: "Mensaje directo",
    gradoInteres: "Medio",
    lastContact: "Ayer",
    nextTask: {
      type: "Enviar cotización",
      date: "10:00",
    },
  },
  {
    id: "3",
    nombre: "Jorge",
    apellido: "Céspedes",
    gradoInteres: "Bajo",
    lastContact: "3 días",
    nextTask: {
      type: "Actualizar datos",
      date: "14:30",
    },
  },
];

interface LeadCardProps {
  lead: Lead;
}

function LeadCard({ lead }: LeadCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Color del badge según el grado de interés
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
              {lead.nombre.charAt(0)}
              {lead.apellido.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-100">
                {lead.nombre} {lead.apellido}
              </h3>
              {lead.gradoInteres && (
                <Badge
                  className={`ml-2 text-xs ${getInterestColor(lead.gradoInteres)}`}
                >
                  {lead.gradoInteres}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {lead.origen} {lead.campaña && `- ${lead.campaña}`}
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

      {lead.nextTask && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Próxima tarea:</span>
            <span className="text-sm font-medium text-gray-200">
              {lead.nextTask.type}
            </span>
          </div>
          <span className="text-xs text-gray-400">{lead.nextTask.date}</span>
        </div>
      )}
    </div>
  );
}

export function LeadsList() {
  return (
    <div className="space-y-4">
      {mockLeads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
