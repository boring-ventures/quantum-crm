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
import { useProducts } from "@/lib/hooks/use-products";
import { useAuth } from "@/providers/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import type { CreateLeadPayload, Product } from "@/types/lead";
import {
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Building2,
  Plus,
} from "lucide-react";
import { DuplicateConfirmationDialog } from "./duplicate-confirmation-dialog";
import { PulsatingButton } from "@/components/magicui/pulsating-button";

// Esquema de validación para el formulario
const newLeadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  maternalLastName: z.string().optional().nullable(),
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

type FormData = z.infer<typeof newLeadSchema>;

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preassignedUserId?: string;
}

export function NewLeadDialog({
  open,
  onOpenChange,
  preassignedUserId,
}: NewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    contact: true,
    business: true,
  });

  // Búsqueda para dropdowns
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  // Obtener datos necesarios para el formulario
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: products, isLoading: isLoadingProducts } = useProducts({
    limit: 1000,
  });
  const createLeadMutation = useCreateLeadMutation();

  // Valores por defecto del formulario
  const formDefaultValues = {
    firstName: "",
    lastName: "",
    maternalLastName: "",
    email: "",
    phone: "",
    cellphone: "",
    productId: "",
    interest: "",
    statusId: "",
    sourceId: "",
    extraComments: "",
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
  const watchedProductId = watch("productId");

  // Estado para almacenar leads duplicados encontrados
  const [duplicateLeads, setDuplicateLeads] = useState<any[]>([]);

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

  // Función para crear el lead (sin verificar duplicados)
  const createLead = async (data: FormData) => {
    setIsPending(true);

    try {
      // Asegurar que firstName y lastName estén definidos
      const firstName = data.firstName || "";
      const lastName = data.lastName || "";

      const cleanedData = {
        firstName,
        lastName,
        email: data.email || null,
        phone: data.phone || null,
        cellphone: data.cellphone,
        maternalLastName: data.maternalLastName || null,
        productId: data.productId === "none" ? null : data.productId || null,
        statusId: data.statusId,
        sourceId: data.sourceId,
        assignedToId: preassignedUserId || user?.id || "",
        qualityScore: data.interest ? parseInt(data.interest) : 1,
        isArchived: false,
        extraComments: data.extraComments || null,
      };

      await createLeadMutation.mutateAsync(cleanedData as CreateLeadPayload);

      toast({
        title: "Lead creado",
        description: "El lead se ha creado correctamente.",
      });

      reset();
      onOpenChange(false);
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

  // Función para verificar duplicados manualmente
  const checkDuplicates = async (cellphone: string) => {
    if (!cellphone || cellphone.length < 5) {
      return [];
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/leads/check-duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cellphone }),
      });

      if (!response.ok) {
        console.error("Error checking duplicates:", response.status);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return [];
    } finally {
      setIsPending(false);
    }
  };

  // Manejar el envío del formulario (con verificación de duplicados)
  const onSubmit = async (data: FormData) => {
    // Verificar duplicados solo al enviar el formulario
    const foundDuplicates = await checkDuplicates(data.cellphone);

    if (foundDuplicates && foundDuplicates.length > 0) {
      // Almacenar duplicados encontrados y mostrar dialog de confirmación
      setDuplicateLeads(foundDuplicates);
      setPendingFormData(data);
      setShowDuplicateDialog(true);
      return;
    }

    // Si no hay duplicados, crear directamente
    await createLead(data);
  };

  // Manejar la confirmación de crear lead duplicado
  const handleConfirmDuplicate = async () => {
    if (!pendingFormData) return;

    setShowDuplicateDialog(false);
    await createLead(pendingFormData);
    setPendingFormData(null);
  };

  // Manejar la cancelación del dialog de duplicados
  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setPendingFormData(null);
  };

  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Para cada autocomplete, usar un estado para el texto de búsqueda y mostrar el nombre seleccionado cuando el dropdown está cerrado
  const selectedSource = sources?.find((s) => s.id === watchedSourceId);
  const sourceInputValue = sourceDropdownOpen
    ? searchSource
    : selectedSource?.name || "";

  const selectedStatus = statuses?.find((s) => s.id === watchedStatusId);
  const statusInputValue = statusDropdownOpen
    ? searchStatus
    : selectedStatus?.name || "";

  const selectedProduct = products?.find((p) => p.id === watchedProductId);
  const productInputValue = productDropdownOpen
    ? searchProduct
    : selectedProduct?.name || "";

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle dropdown functions with proper toggle behavior
  const toggleSourceDropdown = () => {
    setSourceDropdownOpen(!sourceDropdownOpen);
    if (sourceDropdownOpen) {
      setSearchSource("");
    }
  };

  const toggleStatusDropdown = () => {
    setStatusDropdownOpen(!statusDropdownOpen);
    if (statusDropdownOpen) {
      setSearchStatus("");
    }
  };

  const toggleProductDropdown = () => {
    setProductDropdownOpen(!productDropdownOpen);
    if (productDropdownOpen) {
      setSearchProduct("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Plus className="h-7 w-7 text-primary" />
              Nuevo Lead
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => toggleSection("personal")}
                className="flex items-center justify-between w-full text-left text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  Información Personal
                </div>
                {expandedSections.personal ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {expandedSections.personal && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-semibold text-foreground"
                      >
                        Nombre
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Nombre"
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                        {...register("firstName")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-semibold text-foreground"
                      >
                        Apellido
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Apellido paterno"
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                        {...register("lastName")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maternalLastName"
                      className="text-sm font-semibold text-foreground"
                    >
                      Apellido materno
                    </Label>
                    <Input
                      id="maternalLastName"
                      placeholder="Apellido materno"
                      className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                      {...register("maternalLastName")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-semibold text-foreground"
                      >
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        placeholder="Teléfono fijo"
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                        {...register("phone")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="cellphone"
                        className="text-sm font-semibold text-foreground"
                      >
                        Celular <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cellphone"
                        placeholder="Celular"
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                        {...register("cellphone")}
                      />
                      {errors.cellphone && (
                        <p className="text-red-500 text-xs">
                          {errors.cellphone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => toggleSection("contact")}
                className="flex items-center justify-between w-full text-left text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  Información de Contacto
                </div>
                {expandedSections.contact ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {expandedSections.contact && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label
                      htmlFor="sourceId"
                      className="text-sm font-semibold text-foreground"
                    >
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
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20 pl-8 cursor-pointer"
                        aria-label="Buscar fuente"
                        onClick={toggleSourceDropdown}
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
                          if (e.key === "ArrowDown")
                            setSourceDropdownOpen(true);
                        }}
                        onFocus={() => setSourceDropdownOpen(true)}
                        autoComplete="off"
                        readOnly
                      />
                      <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      {sourceDropdownOpen && (
                        <div className="absolute z-20 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
                          {(filteredSources || []).length === 0 && (
                            <div className="px-3 py-2 text-muted-foreground text-sm">
                              No hay coincidencias
                            </div>
                          )}
                          {(filteredSources || []).map((source) => (
                            <div
                              key={source.id}
                              className="cursor-pointer px-3 py-2 hover:bg-muted transition-colors"
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
                          ))}
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
                    <Label
                      htmlFor="status"
                      className="text-sm font-semibold text-foreground"
                    >
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
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20 pl-8 cursor-pointer"
                        aria-label="Buscar estado"
                        onClick={toggleStatusDropdown}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (
                              searchStatus &&
                              filteredStatuses?.length === 1
                            ) {
                              setValue("statusId", filteredStatuses[0].id);
                              setSearchStatus("");
                              setStatusDropdownOpen(false);
                              e.preventDefault();
                            } else if (!searchStatus) {
                              setStatusDropdownOpen(true);
                            }
                          }
                          if (e.key === "ArrowDown")
                            setStatusDropdownOpen(true);
                        }}
                        onFocus={() => setStatusDropdownOpen(true)}
                        autoComplete="off"
                        readOnly
                      />
                      <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      {statusDropdownOpen && (
                        <div className="absolute z-20 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
                          {(filteredStatuses || []).length === 0 && (
                            <div className="px-3 py-2 text-muted-foreground text-sm">
                              No hay coincidencias
                            </div>
                          )}
                          {(filteredStatuses || []).map((status) => (
                            <div
                              key={status.id}
                              className="cursor-pointer px-3 py-2 hover:bg-muted transition-colors flex items-center"
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
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.statusId && (
                      <p className="text-red-500 text-xs">
                        {errors.statusId.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Business Information Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => toggleSection("business")}
                className="flex items-center justify-between w-full text-left text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Información de Negocio
                </div>
                {expandedSections.business ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>

              {expandedSections.business && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label
                      htmlFor="productId"
                      className="text-sm font-semibold text-foreground"
                    >
                      Producto de interés
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Buscar producto..."
                        value={productInputValue}
                        onChange={(e) => {
                          setSearchProduct(e.target.value);
                          setProductDropdownOpen(true);
                          if (e.target.value === "") setValue("productId", "");
                        }}
                        className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20 pl-8 cursor-pointer"
                        aria-label="Buscar producto"
                        onClick={toggleProductDropdown}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (
                              searchProduct &&
                              filteredProducts?.length === 1
                            ) {
                              setValue("productId", filteredProducts[0].id);
                              setSearchProduct("");
                              setProductDropdownOpen(false);
                              e.preventDefault();
                            } else if (!searchProduct) {
                              setProductDropdownOpen(true);
                            }
                          }
                          if (e.key === "ArrowDown")
                            setProductDropdownOpen(true);
                        }}
                        onFocus={() => setProductDropdownOpen(true)}
                        autoComplete="off"
                        readOnly
                      />
                      <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      {productDropdownOpen && (
                        <div className="absolute z-20 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
                          {(filteredProducts || []).length === 0 && (
                            <div className="px-3 py-2 text-muted-foreground text-sm">
                              No hay coincidencias
                            </div>
                          )}
                          {(filteredProducts || []).map((product) => (
                            <div
                              key={product.id}
                              className="cursor-pointer px-3 py-2 hover:bg-muted transition-colors"
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
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="interest"
                      className="text-sm font-semibold text-foreground"
                    >
                      Grado de interés
                    </Label>
                    <Select
                      value={watch("interest") || ""}
                      onValueChange={(value) => setValue("interest", value)}
                    >
                      <SelectTrigger className="h-10 bg-background border-border focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Seleccionar grado de interés" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="3">Alto</SelectItem>
                        <SelectItem value="2">Medio</SelectItem>
                        <SelectItem value="1">Bajo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="extraComments"
                      className="text-sm font-semibold text-foreground"
                    >
                      Comentarios
                    </Label>
                    <Textarea
                      id="extraComments"
                      placeholder="Agregar comentarios o notas importantes..."
                      className="min-h-[100px] bg-background border-border focus:ring-2 focus:ring-primary/20 resize-none"
                      {...register("extraComments")}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6"
              >
                Cancelar
              </Button>

              <PulsatingButton
                type="submit"
                className="h-10 px-6 bg-primary hover:bg-primary/90"
                disabled={isPending}
                pulseColor="hsl(var(--primary))"
                duration="2s"
              >
                {isPending ? "Creando..." : "Crear Lead"}
              </PulsatingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para leads duplicados */}
      <DuplicateConfirmationDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicateLeads={duplicateLeads || []}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
        isLoading={isPending}
      />
    </>
  );
}
