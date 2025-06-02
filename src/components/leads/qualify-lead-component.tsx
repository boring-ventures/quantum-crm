"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadWithRelations } from "@/types/lead";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface QualifyLeadComponentProps {
  lead: LeadWithRelations;
  onQualify?: (isGoodLead: boolean) => void;
}

export function QualifyLeadComponent({
  lead,
  onQualify,
}: QualifyLeadComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleQualifyLead = async (isGoodLead: boolean) => {
    setIsLoading(true);

    try {
      const qualification = isGoodLead ? "GOOD_LEAD" : "BAD_LEAD";

      const response = await fetch(`/api/leads/${lead.id}/qualify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qualification }),
      });

      if (!response.ok) {
        throw new Error("Error al calificar el lead");
      }

      toast({
        title: isGoodLead
          ? "Lead Calificado Positivamente"
          : "Lead Calificado como Negativo",
        description: isGoodLead
          ? "El lead ha sido calificado como bueno y avanzará en el proceso de venta."
          : "El lead ha sido calificado como malo y será archivado.",
      });

      // Invalidar la caché de leads para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // Si es necesario, también invalidar el lead específico
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id] });

      if (onQualify) {
        onQualify(isGoodLead);
      }
    } catch (error) {
      console.error("Error calificando lead:", error);
      toast({
        title: "Error",
        description:
          "Hubo un problema al calificar el lead. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Calificar Lead</h3>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-3 flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              Los leads no calificados no pueden avanzar en el proceso de venta.
              Este lead requiere calificación.
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
              Información del Lead
            </h3>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Nombre:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {lead.firstName} {lead.lastName}
                </span>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Origen:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {lead.source?.name || "Facebook - Campaña Q4"}
                </span>
              </div>

              {lead.phone && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Teléfono:{" "}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {lead.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <Button
              onClick={() => handleQualifyLead(true)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calificar como Good Lead
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleQualifyLead(false)}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calificar como Bad Lead
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
