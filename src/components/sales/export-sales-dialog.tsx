"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ExportSalesDialogProps {
  open: boolean;
  onClose: () => void;
  filters: {
    searchQuery?: string;
    statusFilter?: string;
    categoryFilter?: string;
    dateRange?: { from?: Date; to?: Date };
    assignedToId?: string;
    countryId?: string;
  };
}

export function ExportSalesDialog({
  open,
  onClose,
  filters,
}: ExportSalesDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Operation type selections
  const [includeQuotations, setIncludeQuotations] = useState(true);
  const [includeReservations, setIncludeReservations] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);

  // Filter option
  const [applyFilters, setApplyFilters] = useState(true);

  const handleExport = async () => {
    // Validate at least one type is selected
    if (!includeQuotations && !includeReservations && !includeSales) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos un tipo de operación para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      // Add selected types
      const types: string[] = [];
      if (includeQuotations) types.push("quotations");
      if (includeReservations) types.push("reservations");
      if (includeSales) types.push("sales");
      params.append("types", types.join(","));

      // Add filter flag
      params.append("applyFilters", applyFilters.toString());

      // If applying filters, add the filter parameters
      if (applyFilters) {
        if (filters.searchQuery) {
          params.append("search", filters.searchQuery);
        }
        if (filters.statusFilter && filters.statusFilter !== "all") {
          params.append("status", filters.statusFilter);
        }
        if (filters.categoryFilter && filters.categoryFilter !== "all") {
          params.append("category", filters.categoryFilter);
        }
        if (filters.dateRange?.from) {
          params.append("startDate", filters.dateRange.from.toISOString());
        }
        if (filters.dateRange?.to) {
          params.append("endDate", filters.dateRange.to.toISOString());
        }
        if (filters.assignedToId) {
          params.append("assignedToId", filters.assignedToId);
        }
        if (filters.countryId) {
          params.append("countryId", filters.countryId);
        }
      }

      // Make the export request
      const response = await fetch(`/api/sales/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Error al exportar los datos");
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "sales_export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Los datos se han exportado correctamente a ${filename}`,
      });

      onClose();
    } catch (error) {
      console.error("Error exporting sales data:", error);
      toast({
        title: "Error al exportar",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Datos de Ventas</DialogTitle>
          <DialogDescription>
            Personaliza tu exportación seleccionando los tipos de operaciones y
            si deseas aplicar los filtros actuales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Operation Types Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Tipos de Operaciones</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quotations"
                  checked={includeQuotations}
                  onCheckedChange={(checked) =>
                    setIncludeQuotations(checked as boolean)
                  }
                />
                <Label
                  htmlFor="quotations"
                  className="text-sm font-normal cursor-pointer"
                >
                  Cotizaciones
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reservations"
                  checked={includeReservations}
                  onCheckedChange={(checked) =>
                    setIncludeReservations(checked as boolean)
                  }
                />
                <Label
                  htmlFor="reservations"
                  className="text-sm font-normal cursor-pointer"
                >
                  Reservas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sales"
                  checked={includeSales}
                  onCheckedChange={(checked) =>
                    setIncludeSales(checked as boolean)
                  }
                />
                <Label
                  htmlFor="sales"
                  className="text-sm font-normal cursor-pointer"
                >
                  Ventas
                </Label>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Opciones de Filtrado</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applyFilters"
                checked={applyFilters}
                onCheckedChange={(checked) =>
                  setApplyFilters(checked as boolean)
                }
              />
              <Label
                htmlFor="applyFilters"
                className="text-sm font-normal cursor-pointer"
              >
                Aplicar filtros actuales
              </Label>
            </div>
            {applyFilters && (
              <div className="ml-6 text-xs text-muted-foreground space-y-1">
                <p>Se aplicarán los siguientes filtros:</p>
                <ul className="list-disc list-inside space-y-1">
                  {filters.searchQuery && (
                    <li>Búsqueda: {filters.searchQuery}</li>
                  )}
                  {filters.statusFilter && filters.statusFilter !== "all" && (
                    <li>Estado: {filters.statusFilter}</li>
                  )}
                  {filters.categoryFilter &&
                    filters.categoryFilter !== "all" && (
                      <li>Categoría: {filters.categoryFilter}</li>
                    )}
                  {filters.dateRange?.from && filters.dateRange?.to && (
                    <li>
                      Rango de fechas:{" "}
                      {filters.dateRange.from.toLocaleDateString()} -{" "}
                      {filters.dateRange.to.toLocaleDateString()}
                    </li>
                  )}
                  {!filters.searchQuery &&
                    (!filters.statusFilter || filters.statusFilter === "all") &&
                    (!filters.categoryFilter ||
                      filters.categoryFilter === "all") &&
                    !filters.dateRange?.from && (
                      <li className="text-muted-foreground">
                        Sin filtros activos (se exportarán todos los datos)
                      </li>
                    )}
                </ul>
              </div>
            )}
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> El archivo Excel incluirá hojas separadas
              para cada tipo de operación seleccionada, así como hojas
              adicionales con los detalles de productos asociados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
