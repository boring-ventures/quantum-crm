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
import {
  useProducts,
  useCreateReservationMutation,
  useLeadReservation,
  useLeadQuotation,
} from "@/lib/hooks";
import { uploadDocument } from "@/lib/supabase/upload-document";

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
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: existingReservation, isLoading: reservationLoading } =
    useLeadReservation(leadId);
  const { data: existingQuotation } = useLeadQuotation(leadId);
  const createReservationMutation = useCreateReservationMutation();

  // Estado para productos
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");

  // Estado para datos de reserva
  const [reservationAmount, setReservationAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const [notes, setNotes] = useState("");

  // Estado para carga
  const [isUploading, setIsUploading] = useState(false);

  // Manejar selección de producto
  const handleProductChange = (productId: string) => {
    setProductId(productId);

    // Autocompletar el precio si el producto existe
    if (products) {
      const selectedProductData = products.find((p: any) => p.id === productId);
      if (selectedProductData && selectedProductData.price) {
        setTotalPrice(selectedProductData.price.toString());
      } else {
        setTotalPrice("");
      }
    }
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
    productId &&
    parseFloat(totalPrice) > 0 &&
    parseFloat(reservationAmount) > 0 &&
    paymentMethod &&
    deliveryDate &&
    formDocument &&
    depositDocument;

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsUploading(true);

    try {
      // Crear un array de promesas para subir documentos
      const uploadPromises = [];
      const documentUrls: {
        reservationForm?: string;
        depositReceipt?: string;
        reservationContract?: string;
      } = {};

      // 1. Subir el formulario de reserva (requerido)
      if (formDocument) {
        await uploadDocument(formDocument, leadId, "reservation-form");
      }

      // 2. Subir el comprobante de depósito (requerido)
      if (depositDocument) {
        uploadDocument(depositDocument, leadId, "deposit-receipt");
      }

      // 3. Subir el contrato de reserva (opcional)
      if (contractDocument) {
        await uploadDocument(contractDocument, leadId, "reservation-contract");
      }

      // Esperar a que todos los documentos se suban
      await Promise.all(uploadPromises);

      // 4. Crear la reserva
      await createReservationMutation.mutateAsync({
        leadId,
        quotationId: existingQuotation?.id,
        amount: parseFloat(reservationAmount),
        paymentMethod: paymentMethod,
        deliveryDate: deliveryDate as Date,
        reservationFormUrl: documentUrls.reservationForm,
        depositReceiptUrl: documentUrls.depositReceipt,
        reservationContractUrl: documentUrls.reservationContract,
        vehicleDetails,
        additionalNotes: notes,
      });

      // 5. Mostrar mensaje de éxito
      toast({
        title: "Reserva registrada",
        description: "La reserva se ha registrado correctamente",
        variant: "default",
      });

      // 6. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 7. Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error al crear reserva:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear la reserva",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Registrar reserva para {leadName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ingresa los detalles del pago de reserva
          </p>
        </DialogHeader>

        {productsLoading || reservationLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cargando...
            </p>
          </div>
        ) : (
          <div className="space-y-8 mt-4 pb-2">
            {/* Datos del producto */}
            <div>
              <h3 className="text-lg font-medium mb-4">Datos del producto</h3>

              <div className="space-y-4">
                <div>
                  <Label>
                    Producto <span className="text-red-500">*</span>
                  </Label>
                  <Select value={productId} onValueChange={handleProductChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Cantidad <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      disabled={true} // Cantidad fija en 1 por ahora
                    />
                  </div>
                  <div>
                    <Label>
                      Precio total <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      placeholder="$ 0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Detalles del vehículo</Label>
                  <Textarea
                    placeholder="Color, características especiales, etc."
                    value={vehicleDetails}
                    onChange={(e) => setVehicleDetails(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Detalles de la reserva */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Detalles de la reserva
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Monto de reserva <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    placeholder="$ 0.00"
                  />
                </div>
                <div>
                  <Label>
                    Método de pago <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="CARD">
                        Tarjeta de crédito/débito
                      </SelectItem>
                      <SelectItem value="TRANSFER">
                        Transferencia bancaria
                      </SelectItem>
                      <SelectItem value="CHECK">Cheque</SelectItem>
                      <SelectItem value="FINANCING">Financiamiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label>
                  Fecha de entrega <span className="text-red-500">*</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Documentos */}
            <div>
              <h3 className="text-lg font-medium mb-4">Documentos</h3>

              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">
                    Formulario de reserva{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                      {formDocumentName}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() =>
                        document.getElementById("form-upload")?.click()
                      }
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </Button>
                    <input
                      id="form-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFormDocUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="block mb-2">
                    Comprobante de depósito{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                      {depositDocumentName}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() =>
                        document.getElementById("deposit-upload")?.click()
                      }
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </Button>
                    <input
                      id="deposit-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleDepositDocUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="block mb-2">Contrato de reserva</Label>
                  <div className="flex items-center gap-2">
                    <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                      {contractDocumentName}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() =>
                        document.getElementById("contract-upload")?.click()
                      }
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </Button>
                    <input
                      id="contract-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleContractDocUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <h3 className="text-lg font-medium mb-4">Notas adicionales</h3>
              <Textarea
                placeholder="Detalles adicionales sobre la reserva..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isUploading}
            className="relative"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              "Registrar reserva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
