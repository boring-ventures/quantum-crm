"use client";

import { useState } from "react";
import { CalendarIcon, Upload } from "lucide-react";
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
  // Estado para productos
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
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

  // Manejar envío del formulario
  const handleSubmit = async () => {
    // Aquí iría la lógica para guardar la reserva
    // Por ahora solo simulamos completar el proceso
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  // Validar el formulario
  const isFormValid =
    reservationAmount &&
    paymentMethod &&
    deliveryDate &&
    formDocument &&
    depositDocument;

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

        <div className="space-y-8 mt-4 pb-2">
          {/* Datos del producto */}
          <div>
            <h3 className="text-lg font-medium mb-4">Datos del producto</h3>

            <div className="space-y-4">
              <div>
                <Label>
                  Producto <span className="text-red-500">*</span>
                </Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producto1">
                      Automóvil Sedan 2023
                    </SelectItem>
                    <SelectItem value="producto2">SUV Familiar XL</SelectItem>
                    <SelectItem value="producto3">
                      Camioneta 4x4 2023
                    </SelectItem>
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
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Precio total</Label>
                  <Input
                    type="text"
                    value="$"
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
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
            <h3 className="text-lg font-medium mb-4">Detalles de la reserva</h3>

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
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">
                      Tarjeta de crédito/débito
                    </SelectItem>
                    <SelectItem value="transferencia">
                      Transferencia bancaria
                    </SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
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
                  Formulario de reserva <span className="text-red-500">*</span>
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
                  />
                </div>
              </div>

              <div>
                <Label className="block mb-2">
                  Contrato de reserva <span className="text-red-500">*</span>
                </Label>
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

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Registrar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
