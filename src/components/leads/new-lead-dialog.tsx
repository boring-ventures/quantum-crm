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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { CreateLeadPayload, Company, Product } from "@/types/lead";
import { Search } from "lucide-react";

// Esquema de validación para el formulario
const newLeadSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  maternalLastName: z.string().optional().nullable(),
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
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "personal" | "contact" | "business"
  >("personal");

  // Búsqueda para dropdowns
  const [searchCompany, setSearchCompany] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  // Obtener datos necesarios para el formulario
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const createLeadMutation = useCreateLeadMutation();

  // Estado local para los radios de UI (no se envían al backend)
  const [contactType, setContactType] = useState<string>("ELECTRONIC");
  const [businessType, setBusinessType] = useState<string>("CARS");

  // Valores por defecto del formulario
  const formDefaultValues = {
    firstName: "",
    lastName: "",
    maternalLastName: "",
    email: "",
    phone: "",
    cellphone: "",
    companyId: "",
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
  const watchedCompanyId = watch("companyId");
  const watchedProductId = watch("productId");

  // Filtrar los dropdowns según la búsqueda
  const filteredCompanies = companies?.filter(
    (company: Company) =>
      company &&
      company.id &&
      company.name?.toLowerCase().includes(searchCompany.toLowerCase())
  );

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

  // Verificar si un dropdown debe ser buscable (más de 5 opciones)
  const isSearchableCompanies = (companies?.length || 0) > 5;
  const isSearchableProducts = (products?.length || 0) > 5;
  const isSearchableSources = (sources?.length || 0) > 5;
  const isSearchableStatuses = (statuses?.length || 0) > 5;

  // Manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsPending(true);

    try {
      const cleanedData = {
        ...data,
        companyId: data.companyId === "none" ? "" : data.companyId,
        productId: data.productId === "none" ? "" : data.productId,
        assignedToId: preassignedUserId || user?.id || "",
        qualityScore: data.interest ? parseInt(data.interest) : 1,
        isArchived: false,
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

  // Mapeo de tipos de contacto para UI
  const contactTypeOptions = [
    { value: "ELECTRONIC", label: "Electrónico" },
    { value: "INCOMING_CALL", label: "Llamado Entrante" },
    { value: "OUTGOING_CALL", label: "Llamado Saliente" },
    { value: "STREET_INTERVIEW", label: "Entrevista en calle" },
    { value: "SHOWROOM", label: "Showroom" },
    { value: "DATABASE", label: "Base de datos" },
  ];

  // Mapeo de tipos de negocio para UI
  const businessTypeOptions = [
    { value: "CARS", label: "Autos" },
    { value: "MOTORCYCLES_YADEA", label: "Motos - Yadea" },
    { value: "TRIMOTORS", label: "Trimotos" },
    { value: "BICYCLES", label: "Bicicletas" },
    { value: "MOTORCYCLES_SUPERSOCO", label: "Motos - Supersoco" },
    { value: "SCOOTERS", label: "Patinetas" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
            Nuevo Lead
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
                  <Label htmlFor="firstName">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="lastName">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
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

              <div className="space-y-2">
                <Label htmlFor="maternalLastName">Apellido materno</Label>
                <Input
                  id="maternalLastName"
                  placeholder="Apellido materno"
                  className="bg-input dark:bg-gray-800 dark:border-gray-700"
                  {...register("maternalLastName")}
                />
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
                  <Label htmlFor="cellphone">Celular</Label>
                  <Input
                    id="cellphone"
                    placeholder="Celular"
                    className="bg-input dark:bg-gray-800 dark:border-gray-700"
                    {...register("cellphone")}
                  />
                </div>
              </div>

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
                  <p className="text-red-500 text-xs">{errors.email.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Contacto */}
          {currentStep === "contact" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de contacto</Label>
                <div className="grid grid-cols-2 gap-4">
                  {contactTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroup
                        value={contactType}
                        onValueChange={(value) => setContactType(value)}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={option.value}
                            id={`contact-type-${option.value}`}
                            className="border-gray-600 dark:border-gray-600"
                          />
                          <Label
                            htmlFor={`contact-type-${option.value}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceId">
                  Fuente <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  {isSearchableSources && (
                    <div className="relative mb-2">
                      <Input
                        placeholder="Buscar fuente..."
                        value={searchSource}
                        onChange={(e) => setSearchSource(e.target.value)}
                        className="bg-input dark:bg-gray-800 dark:border-gray-700 pl-8"
                      />
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Select
                    value={watchedSourceId}
                    onValueChange={(value) => setValue("sourceId", value)}
                  >
                    <SelectTrigger className="bg-input dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Seleccionar fuente" />
                    </SelectTrigger>
                    <SelectContent className="bg-background dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                      {isLoadingSources ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        (filteredSources || sources)?.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {errors.sourceId && (
                  <p className="text-red-500 text-xs">
                    {errors.sourceId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">Empresa</Label>
                <div className="relative">
                  {isSearchableCompanies && (
                    <div className="relative mb-2">
                      <Input
                        placeholder="Buscar empresa..."
                        value={searchCompany}
                        onChange={(e) => setSearchCompany(e.target.value)}
                        className="bg-input dark:bg-gray-800 dark:border-gray-700 pl-8"
                      />
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Select
                    value={watchedCompanyId || "none"}
                    onValueChange={(value) =>
                      setValue("companyId", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="bg-input dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-background dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                      {isLoadingCompanies ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Sin empresa</SelectItem>
                          {(filteredCompanies || companies)?.map(
                            (company: Company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            )
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  {isSearchableStatuses && (
                    <div className="relative mb-2">
                      <Input
                        placeholder="Buscar estado..."
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}
                        className="bg-input dark:bg-gray-800 dark:border-gray-700 pl-8"
                      />
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Select
                    value={watchedStatusId}
                    onValueChange={(value) => setValue("statusId", value)}
                  >
                    <SelectTrigger className="bg-input dark:bg-gray-800 dark:border-gray-700">
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
                            {
                              statuses.find((s) => s.id === watchedStatusId)
                                ?.name
                            }
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                      {isLoadingStatuses ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        (filteredStatuses || statuses)?.map((status) => (
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
              <div className="space-y-3">
                <Label>Tipo de negocio</Label>
                <div className="grid grid-cols-2 gap-4">
                  {businessTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroup
                        value={businessType}
                        onValueChange={(value) => setBusinessType(value)}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={option.value}
                            id={`business-type-${option.value}`}
                            className="border-gray-600 dark:border-gray-600"
                          />
                          <Label
                            htmlFor={`business-type-${option.value}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productId">Producto de interés</Label>
                <div className="relative">
                  {isSearchableProducts && (
                    <div className="relative mb-2">
                      <Input
                        placeholder="Buscar producto..."
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="bg-input dark:bg-gray-800 dark:border-gray-700 pl-8"
                      />
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Select
                    value={watchedProductId || "none"}
                    onValueChange={(value) =>
                      setValue("productId", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="bg-input dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="bg-background dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                      {isLoadingProducts ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Sin producto</SelectItem>
                          {(filteredProducts || products)?.map(
                            (product: Product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            )
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
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

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent dark:bg-gray-800 dark:border-gray-700"
            >
              Cancelar
            </Button>

            {currentStep !== "business" ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? "Creando..." : "Crear Lead"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
