"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

// Schema para validación
const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  color: z.string().min(1, "El color es requerido"),
  displayOrder: z.number().int().nonnegative().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: LeadStatus | null;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function LeadStatusDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: LeadStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3498db",
      displayOrder: isEditing ? undefined : undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        color: initialData.color,
        displayOrder: initialData.displayOrder,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#3498db",
        displayOrder: undefined,
      });
    }
  }, [initialData, form]);

  async function handleSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
      toast({
        title: isEditing ? "Estado actualizado" : "Estado creado",
        description: isEditing
          ? "El estado ha sido actualizado con éxito"
          : "Se ha creado un nuevo estado con éxito",
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        variant: "destructive",
        title: `Error al ${isEditing ? "actualizar" : "crear"} el estado`,
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
          <DialogTitle>
            {isEditing ? "Editar Estado" : "Crear Nuevo Estado"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique los detalles del estado y guarde los cambios."
              : "Complete los detalles para crear un nuevo estado de lead."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del estado (opcional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input type="color" {...field} className="w-12 h-10" />
                    </FormControl>
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      className="flex-1"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar Cambios"
                    : "Crear Estado"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
