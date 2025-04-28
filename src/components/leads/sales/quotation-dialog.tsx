"use client";

import { useState } from "react";
import { X, Trash2, Plus, Upload } from "lucide-react";
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

interface QuotationDialogProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId: string;
  onComplete?: () => void;
}

export function QuotationDialog({
  open,
  onClose,
  leadName,
  leadId,
  onComplete,
}: QuotationDialogProps) {
  // Estado para productos añadidos
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
    }>
  >([]);

  // Estado para el formulario
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [proformaDoc, setProformaDoc] = useState<File | null>(null);
  const [proformaDocName, setProformaDocName] = useState(
    "Documento sin título.pdf"
  );

  // Calcular total
  const total = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  // Manejar agregar producto
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const newProduct = {
      id: Date.now().toString(),
      name: selectedProduct,
      quantity,
      price: parseFloat(price || "0"),
    };

    setProducts([...products, newProduct]);
    setSelectedProduct("");
    setQuantity(1);
    setPrice("");
  };

  // Manejar eliminar producto
  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
  };

  // Manejar subida de documento
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProformaDoc(file);
      setProformaDocName(file.name);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    // Aquí iría la lógica para guardar la cotización
    // Por ahora solo simulamos completar el proceso
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Crear cotización para {leadName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Agrega los productos y servicios a cotizar
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Sección de productos */}
          <div>
            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-5">
                <Label>Producto</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
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
              <div className="col-span-3">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="col-span-3">
                <Label>Precio</Label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveProduct(products[0]?.id || "")}
                  disabled={products.length === 0}
                  className="mb-0.5"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar producto
            </Button>

            {/* Lista de productos agregados */}
            {products.length > 0 && (
              <div className="mt-4 space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.quantity} x ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-medium">
                      ${(product.quantity * product.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas adicionales */}
          <div>
            <Label>Notas adicionales</Label>
            <Textarea
              placeholder="Términos y condiciones, detalles de entrega..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Documento de proforma */}
          <div>
            <Label className="block mb-2">
              Documento de proforma <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="border rounded-md p-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                {proformaDocName}
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() =>
                  document.getElementById("proforma-upload")?.click()
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </Button>
              <input
                id="proforma-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t pt-4 mt-6">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">${total.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Generar cotización</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
