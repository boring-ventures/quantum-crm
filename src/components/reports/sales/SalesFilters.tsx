"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Filter, RotateCcw, Target } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UserSelectorDialog } from "@/components/reports/leads/UserSelectorDialog";

interface SalesFiltersProps {
  onFiltersChange: (filters: FiltersData) => void;
  className?: string;
}

interface FiltersData {
  startDate?: string;
  endDate?: string;
  countryIds?: string[];
  assignedToIds?: string[];
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

export function SalesFilters({
  onFiltersChange,
  className,
}: SalesFiltersProps) {
  const [selectedPreset, setSelectedPreset] = useState("30d");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { register, watch, setValue, reset } = useForm<FiltersData>({
    defaultValues: {
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      countryIds: [],
      assignedToIds: [],
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
    });
  }, []);

  // Update filters when form changes
  useEffect(() => {
    const formData = {
      startDate: watchedValues.startDate,
      endDate: watchedValues.endDate,
      countryIds: watchedValues.countryIds || [],
      assignedToIds: selectedUserIds,
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
    <Card className={cn("sticky top-4", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filtros</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Date Range Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={
                    selectedPreset === preset.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs h-8"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">
                Desde
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">
                Hasta
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Selected Period Display */}
          {watchedValues.startDate && watchedValues.endDate && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <strong>Período seleccionado:</strong>
              <br />
              {formatDateForDisplay(watchedValues.startDate)} -{" "}
              {formatDateForDisplay(watchedValues.endDate)}
            </div>
          )}

          {/* Additional Filters */}
          <div className="pt-2 border-t space-y-3">
            <UserSelectorDialog
              selectedIds={selectedUserIds}
              onChange={(ids) => setSelectedUserIds(ids)}
            />

            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Target className="h-3 w-3" />
                Países
              </Label>
              <div className="text-xs text-muted-foreground">
                Disponible en gráfico de países
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
