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
  useUpdateLeadMutation,
  useLeadQuery,
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
  const { data: leadData } = useLeadQuery(leadId);
  const createQuotationMutation = useCreateQuotationMutation();
  const createDocumentMutation = useCreateDocumentMutation();
  const updateLeadMutation = useUpdateLeadMutation();
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
  const [currency, setCurrency] = useState("BOB");

  // Estado para información de facturación
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingNitCarnet, setBillingNitCarnet] = useState("");

  // Estados para carga
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
      if (file.type !== "application/pdf") {
        toast({
          title: "Error de formato",
          description:
            "Solo se permiten archivos PDF para el documento de proforma",
          variant: "destructive",
        });
        return;
      }
      setProformaDoc(file);
      setProformaDocName(file.name);
    }
  };

  // Validar el formulario
  const isFormValid = productList.length > 0 && total > 0 && proformaDoc && 
    billingFirstName.trim() && billingLastName.trim() && billingEmail.trim() && billingNitCarnet.trim();

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

      // 2. Subir el documento a Supabase
      const documentData = await uploadDocument(
        proformaDoc,
        leadId,
        "proforma"
      );

      // 3. Crear el registro del documento
      await createDocumentMutation.mutateAsync({
        leadId,
        name: proformaDoc.name,
        type: proformaDoc.type,
        size: proformaDoc.size,
        url: documentData.url,
      });

      // 4. Crear la cotización
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
        currency,
      });

      // 5. Mostrar mensaje de éxito
      toast({
        title: "Cotización creada",
        description: "La cotización se ha creado correctamente",
        variant: "default",
      });

      // 6. Completar el proceso
      if (onComplete) {
        onComplete();
      }

      // 7. Cerrar el diálogo
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
                <div className="col-span-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Precio</Label>
                  <div className="flex space-x-1">
                    <Input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Moneda</Label>

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
                          {product.quantity} x {currency}{" "}
                          {product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {currency}{" "}
                          {(product.quantity * product.price).toFixed(2)}
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

            {/* Información de facturación */}
            <div>
              <Label className="block mb-4 text-lg font-medium">
                Información de Facturación <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">
                {currency} {total.toFixed(2)}
              </span>
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
