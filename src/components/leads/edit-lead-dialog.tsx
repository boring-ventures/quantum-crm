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
import { useProducts } from "@/lib/hooks/use-products";
import type {
  LeadWithRelations,
  UpdateLeadPayload,
  Product,
} from "@/types/lead";
import { Search } from "lucide-react";

// Esquema de validación para el formulario
const editLeadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .or(z.string().email("Email inválido")),
  phone: z.string().optional().nullable(),
  cellphone: z.string().min(1, "El celular es requerido"),
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
  const [currentStep, setCurrentStep] = useState<
    "personal" | "contact" | "business"
  >("personal");

  // Búsqueda para dropdowns
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Obtener datos necesarios para el formulario
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const updateLeadMutation = useUpdateLeadMutation();

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
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

      // Manejar correctamente el producto según su tipo
      if (lead.product) {
        if (typeof lead.product === "string") {
          setValue("productId", lead.product);
        } else if (typeof lead.product === "object" && "id" in lead.product) {
          setValue("productId", (lead.product as any).id);
        }
      } else {
        setValue("productId", "");
      }

      setValue("interest", lead.qualityScore?.toString() || "");
      setValue("statusId", lead.statusId);
      setValue("sourceId", lead.sourceId);
      setValue("extraComments", lead.extraComments || "");
    }
  }, [lead, open, setValue]);

  // Valores del formulario
  const watchedStatusId = watch("statusId");
  const watchedSourceId = watch("sourceId");
  const watchedProductId = watch("productId");

  const validProducts = products?.filter(
    (product: Product) =>
      product &&
      product.id &&
      typeof product.id === "string" &&
      product.id.trim() !== ""
  );

  // Filtrar los dropdowns según la búsqueda
  const filteredProducts = products?.filter(
    (product: Product) =>
      product &&
      product.id &&
      product.name?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredSources = sources?.filter((source) =>
    source.name?.toLowerCase().includes(searchSource.toLowerCase())
  );

  const filteredStatuses = statuses?.filter((status) =>
    status.name?.toLowerCase().includes(searchStatus.toLowerCase())
  );

  // Para cada autocomplete, usar un estado para el texto de búsqueda y mostrar el nombre seleccionado cuando el dropdown está cerrado
  // Fuente
  const selectedSource = sources?.find((s) => s.id === watchedSourceId);
  const sourceInputValue = sourceDropdownOpen
    ? searchSource
    : selectedSource?.name || "";

  // Estado
  const selectedStatus = statuses?.find((s) => s.id === watchedStatusId);
  const statusInputValue = statusDropdownOpen
    ? searchStatus
    : selectedStatus?.name || "";

  // Producto
  const selectedProduct = products?.find((p) => p.id === watchedProductId);
  const productInputValue = productDropdownOpen
    ? searchProduct
    : selectedProduct?.name || "";

  // Manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    if (!lead) return;

    setIsPending(true);

    try {
      // Limpiar valores "none" por vacíos antes de enviar
      const cleanedData = {
        ...data,
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

  // Manejar la navegación entre pasos
  const handleNextStep = () => {
    if (currentStep === "personal") setCurrentStep("contact");
    else if (currentStep === "contact") setCurrentStep("business");
  };

  // Manejar la navegación hacia atrás
  const handlePrevStep = () => {
    if (currentStep === "business") setCurrentStep("contact");
    else if (currentStep === "contact") setCurrentStep("personal");
  };

  // Si no hay lead, no mostrar nada
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border dark:bg-gray-900 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
            Editar Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="flex w-full border-b border-border dark:border-gray-800">
            <div
              className={`py-2 px-4 cursor-pointer font-medium ${
                currentStep === "personal"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setCurrentStep("personal")}
            >
              Información Personal
            </div>
            <div
              className={`py-2 px-4 cursor-pointer font-medium ${
                currentStep === "contact"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setCurrentStep("contact")}
            >
              Contacto
            </div>
            <div
              className={`py-2 px-4 cursor-pointer font-medium ${
                currentStep === "business"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setCurrentStep("business")}
            >
              Negocio
            </div>
          </div>

          {/* Paso 1: Información Personal */}
          {currentStep === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Nombre"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
                    {...register("firstName")}
                    disabled={isPending}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Apellido"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
                    {...register("lastName")}
                    disabled={isPending}
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
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+591 12345678"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
                    {...register("phone")}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cellphone">
                    Celular <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cellphone"
                    placeholder="+591 71234567"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
                    {...register("cellphone")}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="bg-input dark:bg-gray-800 dark:border-gray-700"
                  {...register("email")}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email.message}</p>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-transparent dark:bg-gray-800 dark:border-gray-700"
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isPending}
                >
                  Siguiente
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Paso 2: Contacto */}
          {currentStep === "contact" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sourceId">
                  Fuente <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar fuente..."
                    value={sourceInputValue}
                    onChange={(e) => {
                      setSearchSource(e.target.value);
                      setSourceDropdownOpen(true);
                      if (e.target.value === "") setValue("sourceId", "");
                    }}
                    className="bg-input dark:bg-gray-800 dark:border-gray-700 mb-2 pl-8"
                    aria-label="Buscar fuente"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (searchSource && filteredSources?.length === 1) {
                          setValue("sourceId", filteredSources[0].id);
                          setSearchSource("");
                          setSourceDropdownOpen(false);
                          e.preventDefault();
                        } else if (!searchSource) {
                          setSourceDropdownOpen(true);
                        }
                      }
                      if (e.key === "ArrowDown") setSourceDropdownOpen(true);
                    }}
                    onFocus={() => setSourceDropdownOpen(true)}
                    autoComplete="off"
                    disabled={isPending}
                  />
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  {sourceDropdownOpen && (
                    <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                      {isLoadingSources ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          Cargando fuentes...
                        </div>
                      ) : (filteredSources || []).length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          No hay coincidencias
                        </div>
                      ) : (
                        (filteredSources || []).map((source) => (
                          <div
                            key={source.id}
                            className="cursor-pointer px-3 py-2 hover:bg-muted dark:hover:bg-gray-700"
                            onClick={() => {
                              setValue("sourceId", source.id);
                              setSearchSource("");
                              setSourceDropdownOpen(false);
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setValue("sourceId", source.id);
                                setSearchSource("");
                                setSourceDropdownOpen(false);
                              }
                            }}
                          >
                            {source.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.sourceId && (
                  <p className="text-red-500 text-xs">
                    {errors.sourceId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar estado..."
                    value={statusInputValue}
                    onChange={(e) => {
                      setSearchStatus(e.target.value);
                      setStatusDropdownOpen(true);
                      if (e.target.value === "") setValue("statusId", "");
                    }}
                    className="bg-input dark:bg-gray-800 dark:border-gray-700 mb-2 pl-8"
                    aria-label="Buscar estado"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (searchStatus && filteredStatuses?.length === 1) {
                          setValue("statusId", filteredStatuses[0].id);
                          setSearchStatus("");
                          setStatusDropdownOpen(false);
                          e.preventDefault();
                        } else if (!searchStatus) {
                          setStatusDropdownOpen(true);
                        }
                      }
                      if (e.key === "ArrowDown") setStatusDropdownOpen(true);
                    }}
                    onFocus={() => setStatusDropdownOpen(true)}
                    autoComplete="off"
                    disabled={isPending}
                  />
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  {statusDropdownOpen && (
                    <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                      {isLoadingStatuses ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          Cargando estados...
                        </div>
                      ) : (filteredStatuses || []).length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          No hay coincidencias
                        </div>
                      ) : (
                        (filteredStatuses || []).map((status) => (
                          <div
                            key={status.id}
                            className="cursor-pointer px-3 py-2 hover:bg-muted dark:hover:bg-gray-700 flex items-center"
                            onClick={() => {
                              setValue("statusId", status.id);
                              setSearchStatus("");
                              setStatusDropdownOpen(false);
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setValue("statusId", status.id);
                                setSearchStatus("");
                                setStatusDropdownOpen(false);
                              }
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.statusId && (
                  <p className="text-red-500 text-xs">
                    {errors.statusId.message}
                  </p>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="bg-transparent dark:bg-gray-800 dark:border-gray-700"
                  disabled={isPending}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isPending}
                >
                  Siguiente
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Paso 3: Negocio */}
          {currentStep === "business" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productId">Producto de interés</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar producto..."
                    value={productInputValue}
                    onChange={(e) => {
                      setSearchProduct(e.target.value);
                      setProductDropdownOpen(true);
                      if (e.target.value === "") setValue("productId", "");
                    }}
                    className="bg-input dark:bg-gray-800 dark:border-gray-700 mb-2 pl-8"
                    aria-label="Buscar producto"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (searchProduct && filteredProducts?.length === 1) {
                          setValue("productId", filteredProducts[0].id);
                          setSearchProduct("");
                          setProductDropdownOpen(false);
                          e.preventDefault();
                        } else if (!searchProduct) {
                          setProductDropdownOpen(true);
                        }
                      }
                      if (e.key === "ArrowDown") setProductDropdownOpen(true);
                    }}
                    onFocus={() => setProductDropdownOpen(true)}
                    autoComplete="off"
                    disabled={isPending}
                  />
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  {productDropdownOpen && (
                    <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                      {isLoadingProducts ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          Cargando productos...
                        </div>
                      ) : (filteredProducts || []).length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">
                          No hay coincidencias
                        </div>
                      ) : (
                        (filteredProducts || []).map((product) => (
                          <div
                            key={product.id}
                            className="cursor-pointer px-3 py-2 hover:bg-muted dark:hover:bg-gray-700"
                            onClick={() => {
                              setValue("productId", product.id);
                              setSearchProduct("");
                              setProductDropdownOpen(false);
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setValue("productId", product.id);
                                setSearchProduct("");
                                setProductDropdownOpen(false);
                              }
                            }}
                          >
                            {product.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Grado de interés</Label>
                <Select
                  value={watch("interest") || ""}
                  onValueChange={(value) => setValue("interest", value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-input dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Seleccionar grado de interés" />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="3">Alto</SelectItem>
                    <SelectItem value="2">Medio</SelectItem>
                    <SelectItem value="1">Bajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extraComments">Comentarios</Label>
                <Textarea
                  id="extraComments"
                  placeholder="Agregar comentarios o notas importantes..."
                  className="bg-input dark:bg-gray-800 dark:border-gray-700 min-h-[100px]"
                  {...register("extraComments")}
                  disabled={isPending}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="bg-transparent dark:bg-gray-800 dark:border-gray-700"
                  disabled={isPending}
                >
                  Anterior
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isPending}
                >
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
