"use client";

import { useState, useEffect } from "react";
import { Upload, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import {
  useCreateSaleMutation,
  useLeadSale,
  useLeadReservation,
  useCreateDocumentMutation,
  useLeadQuotation,
} from "@/lib/hooks";
import { uploadDocument } from "@/lib/supabase/upload-document";

interface SaleDialogProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId: string;
  onComplete?: () => void;
}

export function SaleDialog({
  open,
  onClose,
  leadName,
  leadId,
  onComplete,
}: SaleDialogProps) {
  const { toast } = useToast();
  const { data: existingSale, isLoading: saleLoading } = useLeadSale(leadId);
  const { data: existingReservation } = useLeadReservation(leadId);
  const { data: existingQuotation } = useLeadQuotation(leadId);
  const createSaleMutation = useCreateSaleMutation();
  const createDocumentMutation = useCreateDocumentMutation();

  // Estado para datos de venta
  const [saldo, setSaldo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("BOB");

  // Estado para documentos
  const [saleContract, setSaleContract] = useState<File | null>(null);
  const [saleContractName, setSaleContractName] = useState(
    "Ningún archivo seleccionado"
  );
  const [invoice, setInvoice] = useState<File | null>(null);
  const [invoiceName, setInvoiceName] = useState("Ningún archivo seleccionado");
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentReceiptName, setPaymentReceiptName] = useState(
    "Ningún archivo seleccionado"
  );

  const [notes, setNotes] = useState("");

  // Estado para carga
  const [isUploading, setIsUploading] = useState(false);

  // Autocompletar saldo solo si el usuario no lo ha cambiado
  useEffect(() => {
    if (open && existingQuotation && existingReservation) {
      setPaymentMethod(existingReservation.paymentMethod || "");
    }
  }, [open, existingQuotation, existingReservation]);

  // Comprobar si ya hay una venta existente para saltar este paso
  useEffect(() => {
    if (existingSale && open && onComplete) {
      toast({
        title: "Venta existente",
        description: "Ya existe una venta para este lead",
      });
      onComplete();
      onClose();
    }
  }, [existingSale, open, onComplete, onClose, toast]);

  // Manejador para subir archivo
  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaleContract(file);
      setSaleContractName(file.name);
    }
  };

  // Manejador para subir factura
  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoice(file);
      setInvoiceName(file.name);
    }
  };

  // Manejador para subir comprobante de pago
  const handlePaymentReceiptUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentReceipt(file);
      setPaymentReceiptName(file.name);
    }
  };

  // Validar el formulario - contrato es opcional, factura y comprobante son obligatorios
  const isFormValid =
    parseFloat(saldo) > 0 && paymentMethod && invoice && paymentReceipt;

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsUploading(true);

    try {
      // 1. Subir documentos
      let saleContractUrl: string | undefined;
      let invoiceUrl: string | undefined;
      let paymentReceiptUrl: string | undefined;

      // 1.1 Subir el contrato de venta (opcional)
      if (saleContract) {
        const contractData = await uploadDocument(
          saleContract,
          leadId,
          "sale-contract"
        );

        saleContractUrl = contractData.url;

        // Crear el registro del documento
        await createDocumentMutation.mutateAsync({
          leadId,
          name: saleContract.name,
          type: saleContract.type,
          size: saleContract.size,
          url: contractData.url,
        });
      }

      // 1.2 Subir la factura (obligatorio)
      if (invoice) {
        const invoiceData = await uploadDocument(invoice, leadId, "invoice");

        invoiceUrl = invoiceData.url;

        // Crear el registro del documento
        await createDocumentMutation.mutateAsync({
          leadId,
          name: invoice.name,
          type: invoice.type,
          size: invoice.size,
          url: invoiceData.url,
        });
      }

      // 1.3 Subir el comprobante de pago (obligatorio)
      if (paymentReceipt) {
        const receiptData = await uploadDocument(
          paymentReceipt,
          leadId,
          "payment-receipt"
        );

        paymentReceiptUrl = receiptData.url;

        // Crear el registro del documento
        await createDocumentMutation.mutateAsync({
          leadId,
          name: paymentReceipt.name,
          type: paymentReceipt.type,
          size: paymentReceipt.size,
          url: receiptData.url,
        });
      }

      // 2. Crear la venta
      await createSaleMutation.mutateAsync({
        leadId,
        reservationId: existingReservation?.id,
        amount: parseFloat(saldo),
        paymentMethod,
        saleContractUrl,
        invoiceUrl,
        paymentReceiptUrl,
        additionalNotes: notes,
        currency,
      });

      // 3. Mostrar mensaje de éxito
      toast({
        title: "Venta registrada",
        description: "La venta se ha registrado correctamente",
        variant: "default",
      });

      // 4. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 5. Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error al crear venta:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear la venta",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Registrar venta para {leadName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ingresa los detalles de la venta final
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {saleLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cargando...
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4 pr-2 pb-4">
              {/* Monto total */}
              <div>
                <Label>
                  Saldo <span className="text-red-500">*</span>
                </Label>
                <div className="flex space-x-1">
                  <Input
                    type="number"
                    min={0}
                    value={saldo}
                    onChange={(e) => setSaldo(e.target.value)}
                    placeholder="$ 0.00"
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
              <div>
                <Label>
                  Método de pago <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                    <SelectItem value="FINANCING">Financiamiento</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contrato de venta */}
              <div>
                <Label className="block mb-2">
                  Contrato de venta{" "}
                  <span className="text-gray-500">(opcional)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                    {saleContractName}
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
                    onChange={handleContractUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Factura */}
              <div>
                <Label className="block mb-2">
                  Factura <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                    {invoiceName}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      document.getElementById("invoice-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir
                  </Button>
                  <input
                    id="invoice-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleInvoiceUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Comprobante de pago */}
              <div>
                <Label className="block mb-2">
                  Comprobante de pago <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                    {paymentReceiptName}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      document.getElementById("payment-receipt-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir
                  </Button>
                  <input
                    id="payment-receipt-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handlePaymentReceiptUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <Label>Notas adicionales</Label>
                <Textarea
                  placeholder="Detalles adicionales sobre la venta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex-shrink-0">
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
              "Registrar venta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
