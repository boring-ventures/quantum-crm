"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Country } from "@/types/country";

interface DeleteCountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: Country;
  onConfirmDelete: () => void;
}

export function DeleteCountryDialog({
  open,
  onOpenChange,
  country,
  onConfirmDelete,
}: DeleteCountryDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const userCount = country._count?.users || 0;
  const hasUsers = userCount > 0;

  const handleDelete = async () => {
    if (confirmText !== country.name) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete();
    } catch (error) {
      console.error("Error deleting country:", error);
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) setConfirmText("");
        onOpenChange(newOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar País
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.{" "}
            {hasUsers &&
              "No se puede eliminar un país que esté asignado a usuarios."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasUsers ? (
            <div className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-md text-yellow-800">
              Este país tiene <strong>{userCount}</strong> usuarios asignados.
              Primero debes reasignar estos usuarios a otro país.
            </div>
          ) : (
            <>
              <p className="text-sm">
                Para confirmar, escribe <strong>{country.name}</strong> en el
                campo a continuación:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={country.name}
                disabled={isDeleting}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== country.name || isDeleting || hasUsers}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
