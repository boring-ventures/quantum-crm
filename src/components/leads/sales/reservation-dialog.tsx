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
  const { data: quotationProducts } = useQuotationProducts(
    existingQuotation?.id || ""
  );
  const createReservationMutation = useCreateReservationMutation();

  // Estado para datos de reserva
  const [reservationAmount, setReservationAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [notes, setNotes] = useState("");

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

  const handlePriceChange = (productId: string, newPrice: number) => {
    setModifiedProducts((prev) => ({ ...prev, [productId]: newPrice }));
  };

  // Manejadores para subir archivos
  const handleFormDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormDocument(file);
      setFormDocumentName(file.name);
    }
  };

  const handleDepositDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDepositDocument(file);
      setDepositDocumentName(file.name);
    }
  };

  const handleContractDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    depositDocument;

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!isFormValid || !quotationProducts) return;

    setIsUploading(true);

    try {
      // Variables para almacenar las URLs de los documentos
      let reservationFormUrl = "";
      let depositReceiptUrl = "";
      let reservationContractUrl = "";

      // 1. Subir documentos
      if (formDocument) {
        const formDocUpload = await uploadDocument(
          formDocument,
          leadId,
          "reservation-form"
        );
        reservationFormUrl = formDocUpload.url;
      }

      if (depositDocument) {
        const depositDocUpload = await uploadDocument(
          depositDocument,
          leadId,
          "deposit-receipt"
        );
        depositReceiptUrl = depositDocUpload.url;
      }

      if (contractDocument) {
        const contractDocUpload = await uploadDocument(
          contractDocument,
          leadId,
          "reservation-contract"
        );
        reservationContractUrl = contractDocUpload.url;
      }

      // 2. Crear la reserva
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
      });

      // 3. Mostrar mensaje de éxito
      toast({
        title: "Reserva creada",
        description: "La reserva se ha creado correctamente",
      });

      // 4. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 5. Cerrar el diálogo
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
      <DialogContent
        className="max-w-2xl"
        style={{ height: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle>Nueva Reserva - {leadName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Tabla de productos de la cotización */}
          {quotationProducts && quotationProducts.length > 0 ? (
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
                  <Input
                    id="reservationAmount"
                    type="number"
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    placeholder="0.00"
                  />
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

              {/* Fecha de entrega */}
              <div className="space-y-2">
                <Label>
                  Fecha de Entrega <span className="text-red-500">*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? (
                        format(deliveryDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={(date) => {
                        setDeliveryDate(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
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
                      accept=".pdf,.doc,.docx"
                    />
                    <Label
                      htmlFor="formDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500">
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
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Label
                      htmlFor="depositDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500">
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
                      accept=".pdf,.doc,.docx"
                    />
                    <Label
                      htmlFor="contractDoc"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </Label>
                    <span className="text-sm text-gray-500">
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
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
