"use client";

import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import {
  useLeadStatuses,
  useLeadSources,
  useCreateLeadMutation,
} from "@/lib/hooks";
import { useCompanies } from "@/lib/hooks/use-companies";
import { useProducts } from "@/lib/hooks/use-products";
import { useAuth } from "@/providers/auth-provider";
import type { CreateLeadPayload, Company, Product } from "@/types/lead";

// Esquema de validación para el formulario
const newLeadSchema = z.object({
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
});

type FormData = z.infer<typeof newLeadSchema>;

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  // Obtener datos necesarios para el formulario
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const createLeadMutation = useCreateLeadMutation();

  // Valores por defecto del formulario
  const formDefaultValues = {
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
  };

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: formDefaultValues,
  });

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

  // Logging para debug
  // console.log("Companies:", companies);
  // console.log("Products:", products);

  // Manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsPending(true);

    try {
      const cleanedData = {
        ...data,
        companyId: data.companyId === "none" ? "" : data.companyId,
        productId: data.productId === "none" ? "" : data.productId,
        assignedToId: user?.id || "",
        qualityScore: data.interest ? parseInt(data.interest) : 1,
        isArchived: false,
      };

      await createLeadMutation.mutateAsync(cleanedData as CreateLeadPayload);

      toast({
        title: "Lead creado",
        description: "El lead se ha creado correctamente.",
      });

      reset(); // Limpiar el formulario
      onOpenChange(false); // Cerrar el diálogo
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error al crear el lead",
        description:
          error.message ||
          "Ha ocurrido un error al crear el lead. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-100">
            Nuevo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                <SelectItem value="3">Alto</SelectItem>
                <SelectItem value="2">Medio</SelectItem>
                <SelectItem value="1">Bajo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
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
              {isPending ? "Creando..." : "Crear Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
