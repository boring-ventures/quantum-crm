"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { SpecificationsTab } from "./tabs/specifications-tab";
import { PricesDiscountsTab } from "./tabs/prices-discounts-tab";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type ProductFormData = {
  code: string;
  name: string;
  nameProduct: string;
  descriptionProduct?: string;
  price?: number;
  businessTypeId?: string;
  brandId?: string;
  modelId?: string;
  isActive: boolean;
  images: { url: string; isMain: boolean }[];
  specifications: { feature: string; value: string }[];
  commercialCondition?: string;
  validUntil?: string;
  sellerDiscount?: number;
  managerDiscount?: number;
  countryId?: string;
  currency: string;
  savingsPlan?: {
    type?: string;
    firstQuota?: number;
    totalQuotas?: number;
  };
};

interface ProductsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess?: () => void;
}

export function ProductsEditDialog({
  open,
  onOpenChange,
  productId,
  onSuccess,
}: ProductsEditDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic-info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    nameProduct: "",
    descriptionProduct: "",
    isActive: true,
    images: [],
    specifications: [],
    sellerDiscount: 0,
    managerDiscount: 0,
    currency: "BOB",
    countryId: "",
  });

  // Cargar datos del producto al abrir el diálogo
  useEffect(() => {
    async function fetchProductData() {
      if (!productId || !open) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error("Error al cargar datos del producto");
        }

        const productData = await response.json();

        // Convertir los datos a la estructura esperada por el formulario
        setFormData({
          code: productData.code || "",
          name: productData.name || "",
          nameProduct: productData.nameProduct || "",
          descriptionProduct: productData.descriptionProduct || "",
          price: productData.price || undefined,
          businessTypeId: productData.businessTypeId || "",
          brandId: productData.brandId || "",
          modelId: productData.modelId || "",
          countryId: productData.countryId || "",
          currency: productData.currency || "BOB",
          isActive: productData.isActive ?? true,
          images: productData.images || [],
          specifications: productData.specifications || [],
          commercialCondition: productData.commercialCondition || "",
          validUntil: productData.validUntil || "",
          sellerDiscount: productData.sellerDiscount || 0,
          managerDiscount: productData.managerDiscount || 0,
          savingsPlan: productData.savingsPlan || undefined,
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información del producto",
        });
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductData();
  }, [productId, open, toast, onOpenChange]);

  const updateFormData = (newData: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validaciones básicas
      if (!formData.code || !formData.name || !formData.nameProduct) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
        });
        setIsSubmitting(false);
        return;
      }

      // Preparar datos con tipos correctos
      const dataToSend = {
        ...formData,
        // Convertir campos numéricos a números o null
        price: formData.price ? Number(formData.price) : null,
        sellerDiscount: formData.sellerDiscount
          ? Number(formData.sellerDiscount)
          : null,
        managerDiscount: formData.managerDiscount
          ? Number(formData.managerDiscount)
          : null,
        // Convertir campos del savings plan
        savingsPlan: formData.savingsPlan
          ? {
              ...formData.savingsPlan,
              firstQuota: formData.savingsPlan.firstQuota
                ? Number(formData.savingsPlan.firstQuota)
                : null,
              totalQuotas: formData.savingsPlan.totalQuotas
                ? Number(formData.savingsPlan.totalQuotas)
                : null,
            }
          : null,
        // Limpiar strings vacíos
        descriptionProduct: formData.descriptionProduct || null,
        commercialCondition: formData.commercialCondition || null,
        validUntil: formData.validUntil || null,
        businessTypeId: formData.businessTypeId || null,
        brandId: formData.brandId || null,
        modelId: formData.modelId || null,
        countryId: formData.countryId || null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el producto");
      }

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });

      // Cerrar el diálogo y llamar callback de éxito
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el producto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Cargando Producto</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando datos del producto...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-4">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza la información del producto en las diferentes secciones.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] px-6 pb-6 pt-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic-info">Información Básica</TabsTrigger>
              <TabsTrigger value="specifications">Especificaciones</TabsTrigger>
              <TabsTrigger value="prices">Precios y Descuentos</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <BasicInfoTab
                formData={formData}
                updateFormData={updateFormData}
                goToNextTab={() => setActiveTab("specifications")}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="specifications">
              <SpecificationsTab
                formData={formData}
                updateFormData={updateFormData}
                goToNextTab={() => setActiveTab("prices")}
                goToPreviousTab={() => setActiveTab("basic-info")}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="prices">
              <PricesDiscountsTab
                formData={formData}
                updateFormData={updateFormData}
                onSubmit={handleSubmit}
                goToPreviousTab={() => setActiveTab("specifications")}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
