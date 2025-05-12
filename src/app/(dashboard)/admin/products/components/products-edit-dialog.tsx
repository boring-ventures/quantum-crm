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
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { SpecificationsTab } from "./tabs/specifications-tab";
import { PricesDiscountsTab } from "./tabs/prices-discounts-tab";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProductsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function ProductsEditDialog({
  open,
  onOpenChange,
  productId,
}: ProductsEditDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic-info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: "",
    name: "",
    nameProduct: "",
    descriptionProduct: "",
    isActive: true,
    images: [],
    specifications: [],
    sellerDiscount: 0,
    managerDiscount: 0,
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
          ...productData,
          // Agregar campos que podrían estar ausentes
          specifications: productData.specifications || [],
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

  const updateFormData = (newData: any) => {
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

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el producto");
      }

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });

      // Cerrar el diálogo y refrescar la página
      onOpenChange(false);
      window.location.reload();
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza la información del producto en las diferentes secciones.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
