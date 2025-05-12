"use client";

import { useState } from "react";
import { SourceCategory } from "@/types/lead";
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

interface SourceCategoryConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SourceCategory | null;
  onConfirm: (id: string) => Promise<void>;
}

export function SourceCategoryConfirmDelete({
  open,
  onOpenChange,
  category,
  onConfirm,
}: SourceCategoryConfirmDeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      await onConfirm(category.id);
      onOpenChange(false);
      setConfirmText("");
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error al eliminar la categoría:", error);
      toast({
        title: "Error",
        description:
          "Ocurrió un error al eliminar la categoría. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmButtonDisabled =
    !category || confirmText !== category.name || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Eliminar Categoría
          </DialogTitle>
          <DialogDescription>
            Al eliminar esta categoría, todas las fuentes relacionadas serán
            desactivadas y los leads vinculados perderán esta referencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Esta acción no se puede deshacer. Para confirmar, escriba el nombre
            de la categoría: <strong>{category?.name}</strong>
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escriba el nombre de la categoría"
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
