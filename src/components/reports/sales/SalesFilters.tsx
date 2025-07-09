"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Filter, RotateCcw, Target, X } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UserSelectorDialog } from "@/components/reports/leads/UserSelectorDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SalesFiltersProps {
  onFiltersChange: (filters: FiltersData) => void;
  className?: string;
}

interface FiltersData {
  startDate?: string;
  endDate?: string;
  countryIds?: string[];
  assignedToIds?: string[];
  currency?: string;
}

interface DatePreset {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: "Últimos 7 días",
    value: "7d",
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  },
  {
    label: "Últimos 30 días",
    value: "30d",
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  },
  {
    label: "Últimos 90 días",
    value: "90d",
    startDate: subDays(new Date(), 90),
    endDate: new Date(),
  },
  {
    label: "Último año",
    value: "1y",
    startDate: subYears(new Date(), 1),
    endDate: new Date(),
  },
];

const CURRENCY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Boliviano (Bs)", value: "BOB" },
  { label: "Dólar ($)", value: "USD" },
  { label: "Tether (₮)", value: "USDT" },
];

export function SalesFilters({
  onFiltersChange,
  className,
}: SalesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("30d");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { register, watch, setValue, reset } = useForm<FiltersData>({
    defaultValues: {
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      countryIds: [],
      assignedToIds: [],
      currency: "",
    },
  });

  const watchedValues = watch();
  const previousFiltersRef = useRef<string>("");

  // Serialize filters to detect actual changes
  const serializeFilters = useCallback((data: FiltersData) => {
    return JSON.stringify({
      startDate: data.startDate,
      endDate: data.endDate,
      countryIds: data.countryIds || [],
      assignedToIds: data.assignedToIds || [],
      currency: data.currency || "",
    });
  }, []);

  // Update filters when form changes
  useEffect(() => {
    const formData = {
      startDate: watchedValues.startDate,
      endDate: watchedValues.endDate,
      countryIds: watchedValues.countryIds || [],
      assignedToIds: selectedUserIds,
      currency: watchedValues.currency || "",
    };

    const currentFiltersString = serializeFilters(formData);

    // Only call onFiltersChange if filters actually changed
    if (currentFiltersString !== previousFiltersRef.current) {
      previousFiltersRef.current = currentFiltersString;
      onFiltersChange(formData);

      // Count active filters
      let count = 0;
      if (formData.countryIds?.length) count++;
      if (formData.assignedToIds?.length) count++;
      if (formData.currency) count++;
      setActiveFiltersCount(count);
    }
  }, [watchedValues, onFiltersChange, serializeFilters, selectedUserIds]);

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset.value);
    setValue("startDate", format(preset.startDate, "yyyy-MM-dd"));
    setValue("endDate", format(preset.endDate, "yyyy-MM-dd"));
  };

  const handleResetFilters = () => {
    reset({
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      countryIds: [],
      assignedToIds: [],
      currency: "",
    });
    setSelectedPreset("30d");
    setActiveFiltersCount(0);
    setSelectedUserIds([]);
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn("flex items-center gap-2", className)}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Sales Performance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Date Range Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={
                    selectedPreset === preset.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-sm"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Desde
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                Hasta
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="w-full"
              />
            </div>
          </div>

          {/* Current Selected Period */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Período seleccionado:</span>{" "}
              {formatDateForDisplay(watchedValues.startDate || "")} -{" "}
              {formatDateForDisplay(watchedValues.endDate || "")}
            </p>
          </div>

          {/* User Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Vendedores
            </Label>
            <UserSelectorDialog
              selectedIds={selectedUserIds}
              onChange={setSelectedUserIds}
            />
          </div>

          {/* Currency Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Moneda
            </Label>
            <select
              {...register("currency")}
              className="border rounded-md px-3 py-2 w-full bg-background text-sm"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={activeFiltersCount === 0}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar Filtros
            </Button>
            <Button onClick={() => setIsOpen(false)}>Aplicar Filtros</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
