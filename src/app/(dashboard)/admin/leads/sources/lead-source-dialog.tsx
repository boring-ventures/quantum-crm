"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeadSource, SourceCategory } from "@/types/lead";
import { useQuery } from "@tanstack/react-query";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

// Esquema de validación para crear/editar fuentes de lead
const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  costPerSource: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: LeadSource | null;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function LeadSourceDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: LeadSourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!initialData;

  // Consultar las categorías de fuente activas
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<
    SourceCategory[]
  >({
    queryKey: ["sourceCategories"],
    queryFn: async () => {
      const response = await fetch("/api/source-categories");
      if (!response.ok) {
        throw new Error("Error al obtener las categorías");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar categorías activas
  const activeCategories =
    categories?.filter((category) => category.isActive) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      costPerSource: null,
      isActive: true,
    },
  });

  // Actualizar el formulario cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        categoryId: initialData.categoryId || "none",
        costPerSource: initialData.costPerSource?.toString() || null,
        isActive: initialData.isActive,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        categoryId: "none",
        costPerSource: null,
        isActive: true,
      });
    }
  }, [form, initialData]);

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Preparar datos para enviar
      const dataToSubmit = { ...values };

      // Convertir "none" a null para categoryId
      if (dataToSubmit.categoryId === "none") {
        dataToSubmit.categoryId = null;
      }

      // Si hay un costo por fuente, enviar como un objeto con la conversión a número
      if (dataToSubmit.costPerSource) {
        const submitData = {
          ...dataToSubmit,
          costPerSource: parseFloat(dataToSubmit.costPerSource),
        };
        await onSubmit(submitData as any);
      } else {
        // Si no hay costo, enviar el resto de los datos
        await onSubmit(dataToSubmit);
      }

      form.reset();
      onOpenChange(false);
      toast({
        title: isEditing ? "Fuente actualizada" : "Fuente creada",
        description: isEditing
          ? "La fuente ha sido actualizada exitosamente."
          : "La fuente ha sido creada exitosamente.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error al guardar la fuente:", error);
      toast({
        title: "Error",
        description:
          "Ocurrió un error al guardar la fuente. Por favor, intente nuevamente.",
        variant: "destructive",
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
            {isEditing ? "Editar Fuente" : "Crear Nueva Fuente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique los detalles de la fuente y guarde los cambios."
              : "Complete los detalles para crear una nueva fuente de lead."}
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
                    <Input placeholder="Nombre de la fuente" {...field} />
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
                      placeholder="Descripción de la fuente (opcional)"
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {activeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPerSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo por Fuente</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Costo por fuente (opcional)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Determina si esta fuente está disponible para asignar a
                      leads.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
