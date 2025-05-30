"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PricesDiscountsTabProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmit: () => void;
  goToPreviousTab: () => void;
  isSubmitting: boolean;
}

const savingsPlanTypes = [
  { id: "plan70-30", name: "Plan 70/30" },
  { id: "plan60-40", name: "Plan 60/40" },
  { id: "plan50-50", name: "Plan 50/50" },
];

export function PricesDiscountsTab({
  formData,
  updateFormData,
  onSubmit,
  goToPreviousTab,
  isSubmitting,
}: PricesDiscountsTabProps) {
  const [hasAdvancedPricing, setHasAdvancedPricing] = useState<boolean>(
    !!formData.savingsPlan ||
      !!formData.sellerDiscount ||
      !!formData.managerDiscount
  );
  const [date, setDate] = useState<Date | undefined>(
    formData.validUntil ? new Date(formData.validUntil) : undefined
  );

  // Actualizar fecha de validez en el formData cuando cambia
  useEffect(() => {
    if (date) {
      updateFormData({
        validUntil: date.toISOString().split("T")[0],
      });
    }
  }, [date, updateFormData]);

  // Manejar cambios en los campos numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? undefined : parseFloat(value);
    updateFormData({ [name]: numValue });
  };

  // Manejar cambios en los campos de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  // Actualizar plan de ahorro
  const handleSavingsPlanChange = (field: string, value: any) => {
    const currentPlan = formData.savingsPlan || {};
    updateFormData({
      savingsPlan: {
        ...currentPlan,
        [field]: value,
      },
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-2 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="price">Precio de Lista *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price ?? ""}
              onChange={handleNumberChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="commercialCondition">Condición Comercial</Label>
            <Input
              id="commercialCondition"
              name="commercialCondition"
              value={formData.commercialCondition || ""}
              onChange={handleTextChange}
              placeholder="Términos especiales o condiciones"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="validUntil">Vigencia</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date
                  ? format(date, "PPP", { locale: es })
                  : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div style={{ pointerEvents: "auto" }}>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    updateFormData({
                      validUntil: d ? d.toISOString().split("T")[0] : null,
                    });
                  }}
                  initialFocus
                  disabled={(d) => d < new Date()}
                  style={{ pointerEvents: "auto" }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="sellerDiscount">Descuento Vendedor (%)</Label>
            <Input
              id="sellerDiscount"
              name="sellerDiscount"
              type="number"
              value={formData.sellerDiscount ?? ""}
              onChange={handleNumberChange}
              placeholder="0"
              min="0"
              max="100"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="managerDiscount">Descuento Gerente (%)</Label>
            <Input
              id="managerDiscount"
              name="managerDiscount"
              type="number"
              value={formData.managerDiscount ?? ""}
              onChange={handleNumberChange}
              placeholder="0"
              min="0"
              max="100"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="pt-2">
          <h3 className="text-base font-medium mb-2">Plan de Ahorro</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="savingsPlanType">Tipo de Plan</Label>
              <Select
                value={formData.savingsPlan?.type || ""}
                onValueChange={(value) =>
                  handleSavingsPlanChange("type", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de plan" />
                </SelectTrigger>
                <SelectContent>
                  {savingsPlanTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="firstQuota">Precio 1ª cuota</Label>
              <Input
                id="firstQuota"
                name="firstQuota"
                type="number"
                value={formData.savingsPlan?.firstQuota ?? ""}
                onChange={(e) =>
                  handleSavingsPlanChange(
                    "firstQuota",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="0"
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="totalQuotas">Cantidad de cuotas</Label>
              <Input
                id="totalQuotas"
                name="totalQuotas"
                type="number"
                value={formData.savingsPlan?.totalQuotas ?? ""}
                onChange={(e) =>
                  handleSavingsPlanChange(
                    "totalQuotas",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="0"
                min="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={goToPreviousTab}
          disabled={isSubmitting}
        >
          Anterior
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting || !formData.price}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Producto"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
