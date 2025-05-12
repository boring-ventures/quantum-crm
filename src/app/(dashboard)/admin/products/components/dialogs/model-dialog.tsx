"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (model: any) => void;
  brandId: string;
}

export function ModelDialog({
  open,
  onOpenChange,
  onSuccess,
  brandId,
}: ModelDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    brandId: brandId,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar campos obligatorios
      if (!formData.name.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El nombre es requerido",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.brandId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Se requiere una marca válida",
        });
        setIsSubmitting(false);
        return;
      }

      // Enviar solicitud a la API
      const response = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el modelo");
      }

      const newModel = await response.json();

      toast({
        title: "Éxito",
        description: "Modelo creado correctamente",
      });

      // Llamar al callback de éxito si existe
      if (onSuccess) {
        onSuccess(newModel);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear el modelo",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Modelo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre del modelo"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={isSubmitting}
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !brandId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
