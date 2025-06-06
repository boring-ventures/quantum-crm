"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, Loader2, UploadCloud } from "lucide-react";
import { BusinessTypeDialog } from "../dialogs/business-type-dialog";
import { BrandDialog } from "../dialogs/brand-dialog";
import { ModelDialog } from "../dialogs/model-dialog";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface BasicInfoTabProps {
  formData: any;
  updateFormData: (data: any) => void;
  goToNextTab: () => void;
  isSubmitting: boolean;
}

export function BasicInfoTab({
  formData,
  updateFormData,
  goToNextTab,
  isSubmitting,
}: BasicInfoTabProps) {
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBusinessTypeDialog, setShowBusinessTypeDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Obtener tipos de negocio
        const businessTypesResponse = await fetch("/api/business-types");
        const businessTypesData = await businessTypesResponse.json();
        setBusinessTypes(businessTypesData);

        // Obtener marcas
        const brandsResponse = await fetch("/api/brands");
        const brandsData = await brandsResponse.json();
        setBrands(brandsData);

        // Obtener países
        const countriesResponse = await fetch("/api/admin/countries");
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);

        // Obtener modelos solo si hay una marca seleccionada
        if (formData.brandId) {
          const modelsResponse = await fetch(
            `/api/models?brandId=${formData.brandId}`
          );
          const modelsData = await modelsResponse.json();
          setModels(modelsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [formData.brandId]);

  // Función para obtener modelos cuando cambia la marca
  const handleBrandChange = async (brandId: string) => {
    updateFormData({ brandId, modelId: undefined });

    if (!brandId) {
      setModels([]);
      return;
    }

    try {
      const response = await fetch(`/api/models?brandId=${brandId}`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  const handleBusinessTypeSuccess = async (newBusinessType: any) => {
    setBusinessTypes([...businessTypes, newBusinessType]);
    updateFormData({ businessTypeId: newBusinessType.id });
    setShowBusinessTypeDialog(false);
  };

  const handleBrandSuccess = async (newBrand: any) => {
    setBrands([...brands, newBrand]);
    updateFormData({ brandId: newBrand.id, modelId: undefined });
    setShowBrandDialog(false);
  };

  const handleModelSuccess = async (newModel: any) => {
    setModels([...models, newModel]);
    updateFormData({ modelId: newModel.id });
    setShowModelDialog(false);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Ingrese el código único del producto"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre para identificación del producto"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="nameProduct">Versión *</Label>
          <Input
            id="nameProduct"
            name="nameProduct"
            value={formData.nameProduct}
            onChange={handleInputChange}
            placeholder="Versión o nombre completo del producto"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="businessTypeId">Tipo de Negocio</Label>
            <div className="flex space-x-2">
              <Select
                value={formData.businessTypeId}
                onValueChange={(value) =>
                  updateFormData({ businessTypeId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => setShowBusinessTypeDialog(true)}
                disabled={isLoading}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="brandId">Marca</Label>
            <div className="flex space-x-2">
              <Select
                value={formData.brandId}
                onValueChange={handleBrandChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => setShowBrandDialog(true)}
                disabled={isLoading}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="modelId">Modelo</Label>
            <div className="flex space-x-2">
              <Select
                value={formData.modelId}
                onValueChange={(value) => updateFormData({ modelId: value })}
                disabled={isLoading || !formData.brandId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => setShowModelDialog(true)}
                disabled={isLoading || !formData.brandId}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="countryId">País</Label>
            <Select
              value={formData.countryId}
              onValueChange={(value) => updateFormData({ countryId: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <Label htmlFor="isActive">Estado</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  updateFormData({ isActive: checked })
                }
              />
              <Label htmlFor="isActive">
                {formData.isActive ? "Activo" : "Inactivo"}
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="descriptionProduct">Descripción</Label>
          <Textarea
            id="descriptionProduct"
            name="descriptionProduct"
            value={formData.descriptionProduct || ""}
            onChange={handleInputChange}
            placeholder="Descripción detallada del producto"
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label>Imágenes del Producto</Label>
          <div className="border rounded-md p-4 min-h-[120px] flex flex-wrap gap-4 items-center">
            {formData.images?.length > 0 ? (
              formData.images.map((img: any, idx: number) => (
                <div key={idx} className="relative w-24 h-24">
                  <Image
                    src={img.url}
                    alt="preview"
                    fill
                    className="object-cover rounded"
                  />
                  {img.isMain && (
                    <span className="absolute top-1 left-1 bg-primary text-xs px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
                    onClick={() =>
                      updateFormData({
                        images: formData.images.filter(
                          (_: any, i: number) => i !== idx
                        ),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground">No hay imágenes</span>
            )}
            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded cursor-pointer hover:bg-muted transition">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs">Agregar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  // Simulación de subida, reemplazar por lógica real si es necesario
                  const urls = await Promise.all(
                    files.map(async (file) => {
                      return { url: URL.createObjectURL(file), isMain: false };
                    })
                  );
                  updateFormData({
                    images: [...(formData.images || []), ...urls],
                  });
                }}
              />
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={goToNextTab}
          disabled={
            !formData.code ||
            !formData.name ||
            !formData.nameProduct ||
            isSubmitting
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Siguiente"
          )}
        </Button>
      </CardFooter>

      {/* Diálogos para crear nuevos registros */}
      {showBusinessTypeDialog && (
        <BusinessTypeDialog
          open={showBusinessTypeDialog}
          onOpenChange={setShowBusinessTypeDialog}
          onSuccess={handleBusinessTypeSuccess}
        />
      )}

      {showBrandDialog && (
        <BrandDialog
          open={showBrandDialog}
          onOpenChange={setShowBrandDialog}
          onSuccess={handleBrandSuccess}
        />
      )}

      {showModelDialog && (
        <ModelDialog
          open={showModelDialog}
          onOpenChange={setShowModelDialog}
          brandId={formData.brandId || ""}
          onSuccess={handleModelSuccess}
        />
      )}
    </Card>
  );
}
