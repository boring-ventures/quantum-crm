"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { QuotationProductsTable } from "./quotation-products-table";
import {
  useCreateReservationMutation,
  useLeadReservation,
  useLeadQuotation,
  useQuotationProducts,
  useCreateDocumentMutation,
  useUpdateLeadMutation,
  useLeadQuery,
} from "@/lib/hooks";
import { uploadDocument } from "@/lib/supabase/upload-document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReservationDialogProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId: string;
  onComplete?: () => void;
}

export function ReservationDialog({
  open,
  onClose,
  leadName,
  leadId,
  onComplete,
}: ReservationDialogProps) {
  const { toast } = useToast();
  const { data: existingReservation, isLoading: reservationLoading } =
    useLeadReservation(leadId);
  const { data: existingQuotation } = useLeadQuotation(leadId);
  const { data: quotationProducts, isLoading: quotationProductsLoading } =
    useQuotationProducts(existingQuotation?.id || "");
  const { data: leadData } = useLeadQuery(leadId);
  const createReservationMutation = useCreateReservationMutation();
  const createDocumentMutation = useCreateDocumentMutation();
  const updateLeadMutation = useUpdateLeadMutation();

  // Estado para datos de reserva
  const [reservationAmount, setReservationAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("BOB");

  // Estado para información de facturación
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingNitCarnet, setBillingNitCarnet] = useState("");

  // Estado para productos modificados
  const [modifiedProducts, setModifiedProducts] = useState<{
    [key: string]: number;
  }>({});

  // Estado para documentos
  const [formDocument, setFormDocument] = useState<File | null>(null);
  const [formDocumentName, setFormDocumentName] = useState(
    "Ningún archivo seleccionado"
  );

  const [depositDocument, setDepositDocument] = useState<File | null>(null);
  const [depositDocumentName, setDepositDocumentName] = useState(
    "Ningún archivo seleccionado"
  );

  const [contractDocument, setContractDocument] = useState<File | null>(null);
  const [contractDocumentName, setContractDocumentName] = useState(
    "Ningún archivo seleccionado"
  );

  // Estado para carga
  const [isUploading, setIsUploading] = useState(false);

  // Poblar información de facturación desde los datos del lead
  useEffect(() => {
    if (open && leadData) {
      setBillingFirstName(leadData.firstName || "");
      setBillingLastName(leadData.lastName || "");
      setBillingEmail(leadData.email || "");
      setBillingNitCarnet(leadData.nitCarnet || "");
    }
  }, [open, leadData]);

  const handlePriceChange = (productId: string, newPrice: number) => {
    setModifiedProducts((prev) => ({ ...prev, [productId]: newPrice }));
  };

  // Handler mejorado para selección de fecha
  const handleDateSelect = (date: Date | undefined) => {
    setDeliveryDate(date);
    setCalendarOpen(false);
  };

  // Manejadores para subir archivos
  const handleFormDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Error de formato",
          description:
            "Solo se permiten archivos PDF para el formulario de reserva",
          variant: "destructive",
        });
        return;
      }
      setFormDocument(file);
      setFormDocumentName(file.name);
    }
  };

  const handleDepositDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Error de formato",
          description:
            "Solo se permiten archivos PDF para el comprobante de depósito",
          variant: "destructive",
        });
        return;
      }
      setDepositDocument(file);
      setDepositDocumentName(file.name);
    }
  };

  const handleContractDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Error de formato",
          description:
            "Solo se permiten archivos PDF para el contrato de reserva",
          variant: "destructive",
        });
        return;
      }
      setContractDocument(file);
      setContractDocumentName(file.name);
    }
  };

  // Comprobar si ya hay una reserva existente para saltar este paso
  useEffect(() => {
    if (existingReservation && open && onComplete) {
      toast({
        title: "Reserva existente",
        description: "Ya existe una reserva para este lead",
      });
      onComplete();
      onClose();
    }
  }, [existingReservation, open, onComplete, onClose, toast]);

  // Validar el formulario
  const isFormValid =
    quotationProducts &&
    quotationProducts.length > 0 &&
    parseFloat(reservationAmount) > 0 &&
    paymentMethod &&
    deliveryDate &&
    formDocument &&
    depositDocument &&
    billingFirstName.trim() &&
    billingLastName.trim() &&
    billingEmail.trim() &&
    billingNitCarnet.trim();

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!isFormValid || !quotationProducts) return;

    setIsUploading(true);

    try {
      // 1. Actualizar información de facturación del lead
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: {
          firstName: billingFirstName,
          lastName: billingLastName,
          email: billingEmail,
          nitCarnet: billingNitCarnet,
        }
      });

      // Variables para almacenar las URLs de los documentos
      let reservationFormUrl = "";
      let depositReceiptUrl = "";
      let reservationContractUrl = "";

      // 2. Subir documentos
      if (formDocument) {
        const formDocUpload = await uploadDocument(
          formDocument,
          leadId,
          "reservation-form"
        );
        reservationFormUrl = formDocUpload.url;

        // Crear el registro del documento en la base de datos
        await createDocumentMutation.mutateAsync({
          leadId,
          name: formDocument.name,
          type: formDocument.type,
          size: formDocument.size,
          url: formDocUpload.url,
        });
      }

      if (depositDocument) {
        const depositDocUpload = await uploadDocument(
          depositDocument,
          leadId,
          "deposit-receipt"
        );
        depositReceiptUrl = depositDocUpload.url;

        // Crear el registro del documento en la base de datos
        await createDocumentMutation.mutateAsync({
          leadId,
          name: depositDocument.name,
          type: depositDocument.type,
          size: depositDocument.size,
          url: depositDocUpload.url,
        });
      }

      if (contractDocument) {
        const contractDocUpload = await uploadDocument(
          contractDocument,
          leadId,
          "reservation-contract"
        );
        reservationContractUrl = contractDocUpload.url;

        // Crear el registro del documento en la base de datos
        await createDocumentMutation.mutateAsync({
          leadId,
          name: contractDocument.name,
          type: contractDocument.type,
          size: contractDocument.size,
          url: contractDocUpload.url,
        });
      }

      // 3. Crear la reserva
      await createReservationMutation.mutateAsync({
        leadId,
        quotationId: existingQuotation?.id || "",
        amount: parseFloat(reservationAmount),
        paymentMethod,
        deliveryDate,
        vehicleDetails,
        additionalNotes: notes,
        reservationFormUrl,
        depositReceiptUrl,
        reservationContractUrl: reservationContractUrl || undefined,
        reservationProducts: quotationProducts.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
          price: modifiedProducts[product.id] || product.price,
        })),
        currency,
      });

      // 4. Mostrar mensaje de éxito
      toast({
        title: "Reserva creada",
        description: "La reserva se ha creado correctamente",
      });

      // 5. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 6. Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error al crear la reserva:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la reserva",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Reserva - {leadName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Tabla de productos de la cotización */}
          {quotationProductsLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Cargando productos...
            </div>
          ) : quotationProducts && quotationProducts.length > 0 ? (
            <QuotationProductsTable
              products={quotationProducts.map((product) => ({
                ...product,
                price: modifiedProducts[product.id] || product.price,
              }))}
              onPriceChange={handlePriceChange}
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              No hay productos en la cotización
            </div>
          )}

          {/* Información de facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Información de Facturación <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre <span className="text-red-500">*</span></Label>
                  <Input
                    value={billingFirstName}
                    onChange={(e) => setBillingFirstName(e.target.value)}
                    placeholder="Nombre para facturación"
                  />
                </div>
                <div>
                  <Label>Apellido <span className="text-red-500">*</span></Label>
                  <Input
                    value={billingLastName}
                    onChange={(e) => setBillingLastName(e.target.value)}
                    placeholder="Apellido para facturación"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Correo <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Carnet/NIT <span className="text-red-500">*</span></Label>
                  <Input
                    value={billingNitCarnet}
                    onChange={(e) => setBillingNitCarnet(e.target.value)}
                    placeholder="Número de carnet o NIT"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Detalles de la reserva <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monto de reserva */}
                <div className="space-y-2">
                  <Label htmlFor="reservationAmount">
                    Monto de Reserva <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex space-x-1">
                    <Input
                      id="reservationAmount"
                      type="number"
                      value={reservationAmount}
                      onChange={(e) => setReservationAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="flex-1"
                    />
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="BOB" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOB">BOB</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    Método de Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha de entrega - CALENDARIO CORREGIDO */}
              <div className="space-y-2">
                <Label>
                  Fecha de Entrega <span className="text-red-500">*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !deliveryDate && "text-muted-foreground"
                      }`}
                      onClick={() => setCalendarOpen(!calendarOpen)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate
                        ? format(deliveryDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    style={{ zIndex: 9999 }}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <Calendar
                        mode="single"
                        selected={deliveryDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        locale={es}
                        className="rounded-md border-0"
                        style={{ pointerEvents: "auto" }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Detalles del vehículo */}
              <div className="space-y-2">
                <Label htmlFor="vehicleDetails">Detalles del Vehículo</Label>
                <Input
                  id="vehicleDetails"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  placeholder="Ej: Color, características especiales"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Documentos <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Formulario de Reserva{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFormDocUpload}
                      className="hidden"
                      id="formDoc"
                      accept=".pdf"
                    />
                    <Label
                      htmlFor="formDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {formDocumentName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Comprobante de Depósito{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleDepositDocUpload}
                      className="hidden"
                      id="depositDoc"
                      accept=".pdf"
                    />
                    <Label
                      htmlFor="depositDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {depositDocumentName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contrato de Reserva (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleContractDocUpload}
                      className="hidden"
                      id="contractDoc"
                      accept=".pdf"
                    />
                    <Label
                      htmlFor="contractDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {contractDocumentName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas adicionales */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas o comentarios adicionales"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando reserva...
              </>
            ) : (
              "Crear Reserva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
