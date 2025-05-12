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
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
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

          <div className="pt-4">
            <h3 className="text-lg font-medium mb-4">Plan de Ahorro</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="savingsPlanFirstQuota">Precio 1ª Cuota</Label>
                <Input
                  id="savingsPlanFirstQuota"
                  name="savingsPlanFirstQuota"
                  type="number"
                  value={formData.savingsPlan?.firstQuota ?? ""}
                  onChange={(e) =>
                    handleSavingsPlanChange(
                      "firstQuota",
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value)
                    )
                  }
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting || !formData.savingsPlan?.type}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="savingsPlanTotalQuotas">
                  Cantidad de Cuotas
                </Label>
                <Input
                  id="savingsPlanTotalQuotas"
                  name="savingsPlanTotalQuotas"
                  type="number"
                  value={formData.savingsPlan?.totalQuotas ?? ""}
                  onChange={(e) =>
                    handleSavingsPlanChange(
                      "totalQuotas",
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value)
                    )
                  }
                  placeholder="0"
                  min="1"
                  disabled={isSubmitting || !formData.savingsPlan?.type}
                />
              </div>
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
