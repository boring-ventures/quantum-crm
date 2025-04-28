"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
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
  // Estado para datos de venta
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Estado para documentos
  const [saleContract, setSaleContract] = useState<File | null>(null);
  const [saleContractName, setSaleContractName] = useState(
    "Ningún archivo seleccionado"
  );

  const [notes, setNotes] = useState("");

  // Manejador para subir archivo
  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaleContract(file);
      setSaleContractName(file.name);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    // Aquí iría la lógica para guardar la venta
    // Por ahora solo simulamos completar el proceso
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  // Validar el formulario
  const isFormValid = totalAmount && paymentMethod && saleContract;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Registrar venta para {leadName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ingresa los detalles de la venta final
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Monto total */}
          <div>
            <Label>
              Monto total <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="$ 0.00"
            />
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
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">
                  Tarjeta de crédito/débito
                </SelectItem>
                <SelectItem value="transferencia">
                  Transferencia bancaria
                </SelectItem>
                <SelectItem value="financiamiento">Financiamiento</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contrato de venta */}
          <div>
            <Label className="block mb-2">
              Contrato de venta <span className="text-red-500">*</span>
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

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Registrar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
