"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateLeadMutation } from "@/lib/hooks";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CloseLeadActionProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
}

// Motivos predefinidos de cierre
const CLOSE_REASONS = [
  { id: "not-interested", label: "Cliente no interesado" },
  { id: "bought-competitor", label: "Compró con la competencia" },
  { id: "budget-constraints", label: "Restricciones de presupuesto" },
  { id: "no-response", label: "Sin respuesta del cliente" },
  { id: "not-qualified", label: "Lead no calificado" },
  { id: "other", label: "Otro motivo" },
];

export function CloseLeadAction({
  leadId,
  open,
  onClose,
}: CloseLeadActionProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateLeadMutation = useUpdateLeadMutation();

  const handleCloseLead = async () => {
    try {
      // Construir el motivo final combinando la opción seleccionada con los detalles adicionales
      const selectedReasonLabel =
        CLOSE_REASONS.find((r) => r.id === selectedReason)?.label || "";
      const finalReason = customReason.trim()
        ? `${selectedReasonLabel}: ${customReason.trim()}`
        : selectedReasonLabel;

      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: {
          isClosed: true,
          closedAt: new Date(),
          reasonClosed: finalReason,
        },
      });

      toast({
        title: "Lead cerrado",
        description: "El lead ha sido cerrado correctamente",
      });

      // Invalidar consultas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ["leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      onClose();
    } catch (error) {
      console.error("Error al cerrar el lead:", error);
      toast({
        title: "Error",
        description:
          "No se pudo cerrar el lead. Por favor, inténtalo nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cerrar Lead</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Esta acción marcará el lead como cerrado. Selecciona un motivo para
            el cierre y especifica detalles adicionales.
          </p>

          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="space-y-3"
          >
            {CLOSE_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason && (
            <Textarea
              placeholder="Especifica detalles adicionales sobre el motivo del cierre..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[100px] resize-none mt-4"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCloseLead}
            disabled={
              updateLeadMutation.isPending ||
              !selectedReason ||
              !customReason.trim()
            }
          >
            {updateLeadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Cerrar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
