"use client";

import { useState } from "react";
import { LeadSource } from "@/types/lead";
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

interface LeadSourceConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: LeadSource | null;
  onConfirm: (id: string) => Promise<void>;
}

export function LeadSourceConfirmDelete({
  open,
  onOpenChange,
  source,
  onConfirm,
}: LeadSourceConfirmDeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!source) return;

    setIsDeleting(true);
    try {
      await onConfirm(source.id);
      onOpenChange(false);
      setConfirmText("");
      toast({
        title: "Fuente eliminada",
        description: "La fuente ha sido desactivada exitosamente.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error al eliminar la fuente:", error);
      toast({
        title: "Error",
        description:
          "Ocurrió un error al eliminar la fuente. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmButtonDisabled =
    !source || confirmText !== source.name || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Eliminar Fuente
          </DialogTitle>
          <DialogDescription>
            Al eliminar esta fuente, todos los leads asociados cambiarán a 'Sin
            fuente'.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Esta acción no se puede deshacer. Para confirmar, escriba el nombre
            de la fuente: <strong>{source?.name}</strong>
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escriba el nombre exacto de la fuente"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmText("");
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isConfirmButtonDisabled}
            onClick={handleDelete}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
