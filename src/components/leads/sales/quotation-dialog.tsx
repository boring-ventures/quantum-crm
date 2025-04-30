"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Plus, Upload, Loader2 } from "lucide-react";
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
  useProducts,
  useCreateQuotationMutation,
  useCreateDocumentMutation,
  useLeadQuotation,
} from "@/lib/hooks";
import { uploadDocument } from "@/lib/supabase/upload-document";

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
  // Hooks para datos y mutaciones
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: existingQuotation, isLoading: quotationLoading } =
    useLeadQuotation(leadId);
  const createQuotationMutation = useCreateQuotationMutation();
  const createDocumentMutation = useCreateDocumentMutation();
  const { toast } = useToast();

  // Estado para productos añadidos
  const [productList, setProductList] = useState<
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

  // Estados para carga
  const [isUploading, setIsUploading] = useState(false);

  // Calcular total
  const total = productList.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  // Manejar selección de producto
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);

    // Autocompletar el precio si el producto existe
    if (products) {
      const selectedProductData = products.find((p: any) => p.id === productId);
      if (selectedProductData && selectedProductData.price) {
        setPrice(selectedProductData.price.toString());
      } else {
        setPrice("");
      }
    }
  };

  // Manejar agregar producto
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const selectedProductData = products?.find(
      (p: any) => p.id === selectedProduct
    );

    if (!selectedProductData) return;

    const newProduct = {
      id: selectedProductData.id,
      name: selectedProductData.name,
      quantity,
      price: parseFloat(price || "0"),
    };

    setProductList([...productList, newProduct]);
    setSelectedProduct("");
    setQuantity(1);
    setPrice("");
  };

  // Manejar eliminar producto
  const handleRemoveProduct = (productId: string) => {
    setProductList(productList.filter((p) => p.id !== productId));
  };

  // Manejar subida de documento
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProformaDoc(file);
      setProformaDocName(file.name);
    }
  };

  // Validar el formulario
  const isFormValid = productList.length > 0 && total > 0 && proformaDoc;

  // Comprobar si ya hay una cotización existente para saltar este paso
  // Si la hay, cerrar el diálogo y completar el paso automáticamente
  useEffect(() => {
    if (existingQuotation && open && onComplete) {
      toast({
        title: "Cotización existente",
        description: "Ya existe una cotización para este lead",
      });
      onComplete();
      onClose();
    }
  }, [existingQuotation, open, onComplete, onClose, toast]);

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!isFormValid || !proformaDoc) return;

    setIsUploading(true);

    try {
      // 1. Subir el documento a Supabase
      const documentData = await uploadDocument(
        proformaDoc,
        leadId,
        "proforma"
      );

      // 2. Crear el registro del documento
      await createDocumentMutation.mutateAsync({
        leadId,
        name: proformaDoc.name,
        type: proformaDoc.type,
        size: proformaDoc.size,
        url: documentData.url,
      });

      // 3. Crear la cotización
      await createQuotationMutation.mutateAsync({
        leadId,
        totalAmount: total,
        proformaUrl: documentData.url,
        additionalNotes: notes,
        products: productList.map((product) => ({
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
        })),
      });

      // 4. Mostrar mensaje de éxito
      toast({
        title: "Cotización creada",
        description: "La cotización se ha creado correctamente",
        variant: "default",
      });

      // 5. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 6. Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error al crear cotización:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al crear la cotización",
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
            Crear cotización para {leadName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Agrega los productos y servicios a cotizar
          </p>
        </DialogHeader>

        {productsLoading || quotationLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cargando...
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Sección de productos */}
            <div>
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-5">
                  <Label>Producto</Label>
                  <Select
                    value={selectedProduct}
                    onValueChange={handleProductChange}
                  >
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
                    onClick={() =>
                      productList.length > 0 &&
                      handleRemoveProduct(productList[0].id)
                    }
                    disabled={productList.length === 0}
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
                disabled={
                  !selectedProduct || price === "" || parseFloat(price) <= 0
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar producto
              </Button>

              {/* Lista de productos agregados */}
              {productList.length > 0 && (
                <div className="mt-4 space-y-2">
                  {productList.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.quantity} x ${product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ${(product.quantity * product.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
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
                  disabled={isUploading}
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
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
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
              "Generar cotización"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
