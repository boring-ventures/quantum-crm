"use client";

import { useState } from "react";
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
  savingsPlan?: {
    type?: string;
    firstQuota?: number;
    totalQuotas?: number;
  };
};

interface ProductsCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductsCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProductsCreateDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic-info");
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
  });

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

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el producto");
      }

      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear el producto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información del producto en las diferentes secciones.
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
