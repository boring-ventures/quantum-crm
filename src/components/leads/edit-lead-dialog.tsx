"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  useLeadStatuses,
  useLeadSources,
  useUpdateLeadMutation,
} from "@/lib/hooks";
import { useCompanies } from "@/lib/hooks/use-companies";
import { useProducts } from "@/lib/hooks/use-products";
import type {
  LeadWithRelations,
  UpdateLeadPayload,
  Company,
  Product,
} from "@/types/lead";

// Esquema de validación para el formulario
const editLeadSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  cellphone: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  statusId: z.string().min(1, "El estado es requerido"),
  sourceId: z.string().min(1, "La fuente es requerida"),
  interest: z.string().optional().nullable(),
  extraComments: z.string().optional().nullable(),
});

type FormData = z.infer<typeof editLeadSchema>;

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadWithRelations | null;
}

export function EditLeadDialog({
  open,
  onOpenChange,
  lead,
}: EditLeadDialogProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // Obtener datos necesarios para el formulario
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const updateLeadMutation = useUpdateLeadMutation();

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cellphone: "",
      companyId: "",
      productId: "",
      interest: "",
      statusId: "",
      sourceId: "",
      extraComments: "",
    },
  });

  // Cargar datos del lead cuando se abra el diálogo
  useEffect(() => {
    if (lead && open) {
      setValue("firstName", lead.firstName);
      setValue("lastName", lead.lastName);
      setValue("email", lead.email || "");
      setValue("phone", lead.phone || "");
      setValue("cellphone", lead.cellphone || "");
      setValue("companyId", lead.company || "");
      setValue("productId", lead.product || "");
      setValue("interest", lead.qualityScore?.toString() || "");
      setValue("statusId", lead.statusId);
      setValue("sourceId", lead.sourceId);
      setValue("extraComments", lead.extraComments || "");
    }
  }, [lead, open, setValue]);

  // Valores del formulario
  const watchedStatusId = watch("statusId");
  const watchedSourceId = watch("sourceId");
  const watchedCompanyId = watch("companyId");
  const watchedProductId = watch("productId");

  // Validación adicional para garantizar datos válidos
  const validCompanies = companies?.filter(
    (company: Company) =>
      company &&
      company.id &&
      typeof company.id === "string" &&
      company.id.trim() !== ""
  );

  const validProducts = products?.filter(
    (product: Product) =>
      product &&
      product.id &&
      typeof product.id === "string" &&
      product.id.trim() !== ""
  );

  // Manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    if (!lead) return;

    setIsPending(true);

    try {
      // Limpiar valores "none" por vacíos antes de enviar
      const cleanedData = {
        ...data,
        companyId: data.companyId === "none" ? null : data.companyId || null,
        productId: data.productId === "none" ? null : data.productId || null,
      };

      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: cleanedData as UpdateLeadPayload,
      });

      toast({
        title: "Lead actualizado",
        description: "El lead se ha actualizado correctamente.",
      });

      onOpenChange(false); // Cerrar el diálogo
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error al actualizar el lead",
        description:
          error.message ||
          "Ha ocurrido un error al actualizar el lead. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Si no hay lead, no mostrar nada
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-100">
            Editar Lead
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 mt-4 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Resto del contenido del formulario sin cambios */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Nombre"
                className="bg-gray-800 border-gray-700"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Apellido"
                className="bg-gray-800 border-gray-700"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@ejemplo.com"
                className="bg-gray-800 border-gray-700"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono fijo</Label>
              <Input
                id="phone"
                placeholder="+591 12345678"
                className="bg-gray-800 border-gray-700"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cellphone">Teléfono móvil</Label>
            <Input
              id="cellphone"
              placeholder="+591 71234567"
              className="bg-gray-800 border-gray-700"
              {...register("cellphone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Empresa</Label>
            <Select
              value={watchedCompanyId || "none"}
              onValueChange={(value) =>
                setValue("companyId", value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {isLoadingCompanies ? (
                  <SelectItem value="loading" disabled>
                    Cargando...
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">Sin empresa</SelectItem>
                    {validCompanies?.map((company: Company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedStatusId}
                onValueChange={(value) => setValue("statusId", value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Seleccionar estado">
                    {watchedStatusId && statuses && (
                      <div className="flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: statuses.find(
                              (s) => s.id === watchedStatusId
                            )?.color,
                          }}
                        />
                        {statuses.find((s) => s.id === watchedStatusId)?.name}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {isLoadingStatuses ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.statusId && (
                <p className="text-red-500 text-xs">
                  {errors.statusId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">
                Fuente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedSourceId}
                onValueChange={(value) => setValue("sourceId", value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {isLoadingSources ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.sourceId && (
                <p className="text-red-500 text-xs">
                  {errors.sourceId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productId">Producto</Label>
            <Select
              value={watchedProductId || "none"}
              onValueChange={(value) =>
                setValue("productId", value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>
                    Cargando...
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">Sin producto</SelectItem>
                    {validProducts?.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest">Grado de interés</Label>
            <Select
              value={watch("interest") || ""}
              onValueChange={(value) => setValue("interest", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Seleccionar grado de interés" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="1">Bajo</SelectItem>
                <SelectItem value="2">Medio</SelectItem>
                <SelectItem value="3">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraComments">Comentarios adicionales</Label>
            <Textarea
              id="extraComments"
              placeholder="Comentarios adicionales sobre el lead..."
              className="bg-gray-800 border-gray-700 h-24"
              {...register("extraComments")}
            />
          </div>

          <DialogFooter className="mt-6 sticky bottom-0 bg-gray-900 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
