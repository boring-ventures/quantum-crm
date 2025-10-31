"use client";

import { useState, useRef, useEffect } from "react";
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
import { useUserStore } from "@/store/userStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { CreateLeadPayload, Product, LeadWithRelations } from "@/types/lead";
import { Search, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp, User, Calendar } from "lucide-react";
import { DuplicateConfirmationDialog } from "./duplicate-confirmation-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  nitCarnet: z.string().optional().nullable(),
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
  preassignedUserId?: string; // ID de vendedor pre-asignado (para administradores)
}

export function NewLeadDialog({
  open,
  onOpenChange,
  preassignedUserId,
}: NewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useUserStore();
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "personal" | "contact" | "business"
  >("personal");
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Estados para verificación en tiempo real
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [realtimeDuplicates, setRealtimeDuplicates] = useState<LeadWithRelations[]>([]);
  const [showClosedLeadPreview, setShowClosedLeadPreview] = useState(false);
  const [expandedPreviewCards, setExpandedPreviewCards] = useState<Set<string>>(new Set());

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
    nitCarnet: "",
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
  const watchedCellphone = watch("cellphone");

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
        nitCarnet: data.nitCarnet || null,
        productId: data.productId === "none" ? null : data.productId || null,
        statusId: data.statusId,
        sourceId: data.sourceId,
        assignedToId: preassignedUserId || user?.id || "",
        createdById: user?.id || "",
        qualityScore: data.interest ? parseInt(data.interest) : 1,
        isArchived: false,
        extraComments: data.extraComments || null,
      };

      await createLeadMutation.mutateAsync(cleanedData as CreateLeadPayload);

      toast({
        title: "Lead creado",
        description: "El lead se ha creado correctamente.",
      });

      reset(); // Limpiar el formulario
      setCurrentStep("personal"); // Reiniciar al primer paso
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

  // Función para verificar duplicados (reutilizable)
  const checkDuplicates = async (cellphone: string, isRealtime: boolean = false) => {
    if (!cellphone || cellphone.length < 5) {
      return [];
    }

    if (isRealtime) {
      setIsCheckingDuplicates(true);
    } else {
      setIsPending(true);
    }

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
      if (isRealtime) {
        setIsCheckingDuplicates(false);
      } else {
        setIsPending(false);
      }
    }
  };

  // Verificación en tiempo real con debounce
  useEffect(() => {
    const cellphone = watchedCellphone;

    if (!cellphone || cellphone.length < 5) {
      setRealtimeDuplicates([]);
      return;
    }

    // Debounce de 800ms
    const timeoutId = setTimeout(async () => {
      const duplicates = await checkDuplicates(cellphone, true);
      setRealtimeDuplicates(duplicates || []);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [watchedCellphone]);

  // Manejar el envío del formulario (crear directamente sin verificación adicional)
  const onSubmit = async (data: FormData) => {
    // Crear el lead directamente, ya que la verificación se hace en tiempo real
    await createLead(data);
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

  // Manejar el uso de datos de un lead cerrado (desde tiempo real o diálogo)
  const handleUseClosedLeadData = (closedLead: LeadWithRelations) => {
    if (!closedLead) return;

    // Rellenar el formulario con los datos del lead cerrado
    setValue("firstName", closedLead.firstName || "");
    setValue("lastName", closedLead.lastName || "");
    setValue("maternalLastName", closedLead.maternalLastName || "");
    setValue("email", closedLead.email || "");
    setValue("phone", closedLead.phone || "");
    setValue("cellphone", closedLead.cellphone || "");
    setValue("sourceId", closedLead.sourceId || "");
    setValue("statusId", closedLead.statusId || "");
    setValue("productId", closedLead.productId || "");
    setValue("extraComments", closedLead.extraComments || "");
    setValue("nitCarnet", closedLead.nitCarnet || "");

    // Limpiar el estado de duplicados
    setDuplicateLeads([]);
    setPendingFormData(null);
    setShowClosedLeadPreview(false);

    // Mostrar mensaje de éxito
    toast({
      title: "Datos rellenados",
      description:
        "Los datos del lead cerrado han sido cargados en el formulario.",
    });
  };

  // Separar leads activos y cerrados en tiempo real, y eliminar duplicados por ID
  const uniqueLeads = realtimeDuplicates.reduce((acc, lead) => {
    if (!acc.find(l => l.id === lead.id)) {
      acc.push(lead);
    }
    return acc;
  }, [] as LeadWithRelations[]);

  const realtimeActiveLeads = uniqueLeads.filter(lead => !lead.isClosed);
  const realtimeClosedLeads = uniqueLeads.filter(lead => lead.isClosed);

  // Función para manejar expansión de tarjetas de vista previa
  const togglePreviewCard = (leadId: string) => {
    setExpandedPreviewCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

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

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139);
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-background border-border dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
              Nuevo Lead
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4 overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(203 213 225) transparent"
          }}>
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
                      placeholder="Apellido paterno"
                      className="bg-input dark:bg-gray-800 dark:border-gray-700"
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
                    <Label htmlFor="maternalLastName">Apellido materno</Label>
                    <Input
                      id="maternalLastName"
                      placeholder="Apellido materno"
                      className="bg-input dark:bg-gray-800 dark:border-gray-700"
                      {...register("maternalLastName")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nitCarnet">Carnet/NIT</Label>
                    <Input
                      id="nitCarnet"
                      placeholder="Número de carnet o NIT"
                      className="bg-input dark:bg-gray-800 dark:border-gray-700"
                      {...register("nitCarnet")}
                    />
                    {errors.nitCarnet && (
                      <p className="text-red-500 text-xs">
                        {errors.nitCarnet.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="Teléfono fijo"
                      className="bg-input dark:bg-gray-800 dark:border-gray-700"
                      {...register("phone")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cellphone">
                      Celular <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cellphone"
                      placeholder="Celular"
                      className="bg-input dark:bg-gray-800 dark:border-gray-700"
                      {...register("cellphone")}
                    />
                    {errors.cellphone && (
                      <p className="text-red-500 text-xs">
                        {errors.cellphone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Indicador de verificación en tiempo real */}
                {isCheckingDuplicates && watchedCellphone && watchedCellphone.length >= 5 && (
                  <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      Verificando duplicados...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta de leads activos duplicados con botón para ver detalles */}
                {!isCheckingDuplicates && realtimeActiveLeads.length > 0 && (
                  <div className="space-y-3">
                    <Alert className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
                        <div className="flex flex-col gap-3">
                          <span>
                            <strong>¡Atención!</strong> Se encontraron {realtimeActiveLeads.length} lead(s) activo(s) con este número de celular.
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDuplicateLeads(uniqueLeads);
                              setShowDuplicateDialog(true);
                            }}
                            className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-900/70 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 font-medium"
                          >
                            Ver detalles completos
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Vista previa de leads activos */}
                    <div className="space-y-2">
                      {realtimeActiveLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => togglePreviewCard(lead.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-700 dark:text-orange-300 font-semibold text-sm">
                                {lead.firstName?.charAt(0) || lead.lastName?.charAt(0) || "?"}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {lead.firstName && lead.lastName
                                    ? `${lead.firstName} ${lead.lastName}`
                                    : lead.firstName || lead.lastName || "Sin nombre"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {lead.cellphone}
                                </p>
                              </div>
                            </div>
                            {expandedPreviewCards.has(lead.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>

                          {expandedPreviewCards.has(lead.id) && (
                            <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                                {lead.email && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                    <p className="text-gray-900 dark:text-gray-100 truncate">{lead.email}</p>
                                  </div>
                                )}
                                {lead.status && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                                    <p className="text-gray-900 dark:text-gray-100">{lead.status.name}</p>
                                  </div>
                                )}
                                {lead.assignedTo && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Asignado:</span>
                                    <p className="text-gray-900 dark:text-gray-100 truncate">{lead.assignedTo.name}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Creado:</span>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: es })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerta de leads cerrados - con opción de ver detalles */}
                {!isCheckingDuplicates && realtimeActiveLeads.length === 0 && realtimeClosedLeads.length > 0 && (
                  <div className="space-y-3">
                    <Alert className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                        <div className="flex flex-col gap-3">
                          <span>
                            Se encontró {realtimeClosedLeads.length} lead(s) cerrado(s) con este número.
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDuplicateLeads(uniqueLeads);
                              setShowDuplicateDialog(true);
                            }}
                            className="bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-medium"
                          >
                            Ver detalles completos
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Vista previa de leads cerrados */}
                    <div className="space-y-2">
                      {realtimeClosedLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="border border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => togglePreviewCard(lead.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-semibold text-sm">
                                {lead.firstName?.charAt(0) || lead.lastName?.charAt(0) || "?"}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {lead.firstName && lead.lastName
                                    ? `${lead.firstName} ${lead.lastName}`
                                    : lead.firstName || lead.lastName || "Sin nombre"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {lead.cellphone} • <span className="text-red-600 dark:text-red-400">Cerrado</span>
                                </p>
                              </div>
                            </div>
                            {expandedPreviewCards.has(lead.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>

                          {expandedPreviewCards.has(lead.id) && (
                            <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                                {lead.email && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                    <p className="text-gray-900 dark:text-gray-100 truncate">{lead.email}</p>
                                  </div>
                                )}
                                {lead.status && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                                    <p className="text-gray-900 dark:text-gray-100">{lead.status.name}</p>
                                  </div>
                                )}
                                {lead.assignedTo && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Asignado:</span>
                                    <p className="text-gray-900 dark:text-gray-100 truncate">{lead.assignedTo.name}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Creado:</span>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: es })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUseClosedLeadData(lead)}
                                className="w-full mt-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs"
                              >
                                Usar datos de este lead
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin duplicados */}
                {!isCheckingDuplicates && watchedCellphone && watchedCellphone.length >= 5 && realtimeDuplicates.length === 0 && (
                  <Alert className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                      No se encontraron leads duplicados.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
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
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    {sourceDropdownOpen && (
                      <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                        {(filteredSources || []).length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No hay coincidencias
                          </div>
                        )}
                        {(filteredSources || []).map((source) => (
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
                            <div className="flex items-center justify-between">
                              <span>{source.name}</span>
                              {source.category && (
                                <div className="flex items-center ml-2">
                                  <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{
                                      backgroundColor:
                                        source.category.color || "#6B7280",
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {source.category.name}
                                  </span>
                                </div>
                              )}
                            </div>
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
                  {selectedSource?.category && (
                    <div className="mt-2 p-2 bg-muted/30 rounded-md">
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">
                          Origen del lead:
                        </span>
                        <div className="flex items-center">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                selectedSource.category.color || "#6B7280",
                            }}
                          />
                          <span className="font-medium">
                            {selectedSource.category.name}
                          </span>
                        </div>
                      </div>
                    </div>
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
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    {statusDropdownOpen && (
                      <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                        {(filteredStatuses || []).length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No hay coincidencias
                          </div>
                        )}
                        {(filteredStatuses || []).map((status) => (
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
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    {productDropdownOpen && (
                      <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded shadow max-h-96 overflow-auto">
                        {(filteredProducts || []).length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No hay coincidencias
                          </div>
                        )}
                        {(filteredProducts || []).map((product) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Grado de interés</Label>
                  <Select
                    value={watch("interest") || ""}
                    onValueChange={(value) => setValue("interest", value)}
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
                  />
                </div>
              </div>
            )}

          </form>

          <DialogFooter className="mt-4 flex-shrink-0 border-t border-border dark:border-gray-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent dark:bg-gray-800 dark:border-gray-700"
            >
              Cancelar
            </Button>

            {currentStep === "personal" && (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
              </Button>
            )}

            {currentStep === "contact" && (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
              </Button>
            )}

            {currentStep === "business" && (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? "Creando..." : "Crear Lead"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de información para leads duplicados */}
      <DuplicateConfirmationDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicateLeads={duplicateLeads || []}
        onUseClosedLeadData={handleUseClosedLeadData}
      />
    </>
  );
}
