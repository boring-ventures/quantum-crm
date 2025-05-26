"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FilterData {
  companies: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string; companyId: string }>;
  businessTypes: Array<{ id: string; name: string }>;
}

interface DashboardFiltersProps {
  activeFilters: {
    company: string;
    brand: string;
    business: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
}

export function DashboardFilters({
  activeFilters,
  onFilterChange,
}: DashboardFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  // Obtener datos de filtros
  const { data: filterData, isLoading } = useQuery<FilterData>({
    queryKey: ["dashboard-filters"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/filters");
      if (!response.ok) {
        throw new Error("Error al cargar filtros");
      }
      return response.json();
    },
  });

  // Filtrar marcas según la empresa seleccionada
  const filteredBrands = filterData?.brands.filter(
    (brand) =>
      activeFilters.company === "all-companies" ||
      brand.companyId === activeFilters.company
  );

  return (
    <div className="dark:bg-gray-900/60 bg-white/90 rounded-lg border dark:border-gray-800 border-gray-200 p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 dark:text-gray-400 text-gray-500" />
          <h2 className="text-sm dark:text-gray-300 text-gray-700">Filtros</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 dark:text-gray-400 text-gray-500 dark:hover:text-gray-200 hover:text-gray-900"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Ocultar</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Mostrar</span>
            </>
          )}
        </Button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {/* Filtro de Empresas */}
          <div>
            <Select
              value={activeFilters.company}
              onValueChange={(value) => {
                onFilterChange("company", value);
                // Reset brand if company changes
                if (activeFilters.brand !== "all-brands") {
                  onFilterChange("brand", "all-brands");
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-300 dark:hover:border-gray-600 hover:border-gray-400 shadow-sm transition-colors h-8 text-xs dark:text-gray-300 text-gray-700">
                <SelectValue placeholder="Todas las Empresas" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-700">
                <SelectItem value="all-companies">
                  Todas las Empresas
                </SelectItem>
                {filterData?.companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Marcas */}
          <div>
            <Select
              value={activeFilters.brand}
              onValueChange={(value) => onFilterChange("brand", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-300 dark:hover:border-gray-600 hover:border-gray-400 shadow-sm transition-colors h-8 text-xs dark:text-gray-300 text-gray-700">
                <SelectValue placeholder="Todas las Marcas" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-700">
                <SelectItem value="all-brands">Todas las Marcas</SelectItem>
                {filteredBrands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Tipos de Negocio */}
          <div>
            <Select
              value={activeFilters.business}
              onValueChange={(value) => onFilterChange("business", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-300 dark:hover:border-gray-600 hover:border-gray-400 shadow-sm transition-colors h-8 text-xs dark:text-gray-300 text-gray-700">
                <SelectValue placeholder="Todos los negocios" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-700">
                <SelectItem value="all-businesses">
                  Todos los negocios
                </SelectItem>
                {filterData?.businessTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
