"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeadWithRelations } from "@/types/lead";

interface QualifyLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadWithRelations | null;
  onQualify: (isGoodLead: boolean) => void;
}

export function QualifyLeadDialog({
  open,
  onOpenChange,
  lead,
  onQualify,
}: QualifyLeadDialogProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Calificar Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-3 flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              Los leads calificados como "Bad Lead" son cerrados y no avanzan en
              el proceso de venta. Esta acción no se puede deshacer.
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
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <Button
            variant="destructive"
            onClick={() => onQualify(false)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Bad Lead
          </Button>
          <Button
            onClick={() => onQualify(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Good Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
