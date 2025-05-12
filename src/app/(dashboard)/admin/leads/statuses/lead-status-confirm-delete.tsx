"use client";

import { useState } from "react";
import { LeadStatus } from "@/types/lead";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LeadStatusConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: LeadStatus | null;
  onConfirm: (id: string) => Promise<void>;
}

export function LeadStatusConfirmDelete({
  open,
  onOpenChange,
  status,
  onConfirm,
}: LeadStatusConfirmDeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!status) return null;

  const isConfirmDisabled = confirmText !== status.name;

  async function handleConfirm() {
    if (isConfirmDisabled || !status) return;

    try {
      setIsSubmitting(true);
      await onConfirm(status.id);
      toast({
        title: "Estado desactivado",
        description: `El estado "${status.name}" ha sido desactivado correctamente.`,
      });
      onOpenChange(false);
      setConfirmText("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al desactivar el estado",
        description:
          error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Confirmar desactivación
          </DialogTitle>
          <DialogDescription>
            Este estado quedará inhabilitado y los leads que lo usaban
            aparecerán como 'Sin estado'.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Esta acción no es reversible. Para confirmar, escribe el nombre del
            estado:
            <span className="font-medium ml-1">{status.name}</span>
          </p>

          <div className="space-y-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe el nombre exacto del estado"
              className={
                isConfirmDisabled ? "border-destructive" : "border-green-500"
              }
            />
            {isConfirmDisabled && (
              <p className="text-xs text-destructive">
                Ingresa exactamente "{status.name}" para continuar
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmText("");
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isSubmitting}
          >
            {isSubmitting ? "Desactivando..." : "Desactivar Estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
