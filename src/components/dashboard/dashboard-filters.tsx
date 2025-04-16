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

interface DashboardFiltersProps {
  activeFilters: {
    company: string;
    brand: string;
    branch: string;
    business: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
}

export function DashboardFilters({
  activeFilters,
  onFilterChange,
}: DashboardFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900/60 rounded-lg border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm text-gray-300">Filtros</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 text-gray-400 hover:text-gray-200"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div>
            <Select
              value={activeFilters.company}
              onValueChange={(value) => onFilterChange("company", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 hover:border-gray-600 shadow-sm transition-colors h-8 text-xs text-gray-300">
                <SelectValue placeholder="Todas las Empresas" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="all-companies">
                  Todas las Empresas
                </SelectItem>
                <SelectItem value="quantum">Quantum</SelectItem>
                <SelectItem value="salvador">Salvador</SelectItem>
                <SelectItem value="paraguay">Paraguay</SelectItem>
                <SelectItem value="peru">Peru</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={activeFilters.brand}
              onValueChange={(value) => onFilterChange("brand", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 hover:border-gray-600 shadow-sm transition-colors h-8 text-xs text-gray-300">
                <SelectValue placeholder="Todas las Marcas" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="all-brands">Todas las Marcas</SelectItem>
                <SelectItem value="quantum">Quantum</SelectItem>
                <SelectItem value="super-soco">Super Soco</SelectItem>
                <SelectItem value="yadea">Yadea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={activeFilters.branch}
              onValueChange={(value) => onFilterChange("branch", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 hover:border-gray-600 shadow-sm transition-colors h-8 text-xs text-gray-300">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="all-branches">
                  Todas las sucursales
                </SelectItem>
                <SelectItem value="full-energy">Full Energy</SelectItem>
                <SelectItem value="oruro">Oruro</SelectItem>
                <SelectItem value="patuju">Patuju</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={activeFilters.business}
              onValueChange={(value) => onFilterChange("business", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 hover:border-gray-600 shadow-sm transition-colors h-8 text-xs text-gray-300">
                <SelectValue placeholder="Todos los negocios" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="all-businesses">
                  Todos los negocios
                </SelectItem>
                <SelectItem value="autos">Autos</SelectItem>
                <SelectItem value="bicicletas">Bicicletas</SelectItem>
                <SelectItem value="motos-yadea">Motos Yadea</SelectItem>
                <SelectItem value="motos-supersoco">Motos Supersoco</SelectItem>
                <SelectItem value="trimotos">Trimotos</SelectItem>
                <SelectItem value="patineta">Patineta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
