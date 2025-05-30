"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FilterIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export function ProductFilters({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
}: ProductFiltersProps) {
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then(setBrands);
    fetch("/api/business-types")
      .then((r) => r.json())
      .then(setBusinessTypes);
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetch(`/api/models?brandId=${selectedBrand}`)
        .then((r) => r.json())
        .then(setModels);
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    setFilters({
      ...filters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange([0, 20000]);
    setFromDate(undefined);
    setToDate(undefined);
    setSelectedBrand("");
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Buscar por código, marca, modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4"
            />
          </div>
        </div>
        <Select
          value={filters.businessType ?? "__all__"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              businessType: v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {businessTypes.map((type: any) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FilterIcon className="h-4 w-4" />
              Filtros Avanzados
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rango de Precio</Label>
                <div className="pt-2">
                  <Slider
                    defaultValue={[0, 20000]}
                    max={20000}
                    step={100}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select
                    value={filters.brandId ?? "__all__"}
                    onValueChange={(v) => {
                      setFilters({
                        ...filters,
                        brandId: v === "__all__" ? undefined : v,
                      });
                      setSelectedBrand(v === "__all__" ? "" : v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {brands.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select
                    value={filters.modelId ?? "__all__"}
                    onValueChange={(v) =>
                      setFilters({
                        ...filters,
                        modelId: v === "__all__" ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      {models.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vigencia</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate
                          ? format(fromDate, "PPP", { locale: es })
                          : "Desde"}
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
                          selected={fromDate}
                          onSelect={(date) => {
                            setFromDate(date);
                            setFilters({
                              ...filters,
                              fromDate: date?.toISOString(),
                            });
                          }}
                          initialFocus
                          style={{ pointerEvents: "auto" }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate
                          ? format(toDate, "PPP", { locale: es })
                          : "Hasta"}
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
                          selected={toDate}
                          onSelect={(date) => {
                            setToDate(date);
                            setFilters({
                              ...filters,
                              toDate: date?.toISOString(),
                            });
                          }}
                          initialFocus
                          style={{ pointerEvents: "auto" }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={filters.active === "true"}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        active: checked ? "true" : undefined,
                      })
                    }
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mostrar solo productos activos
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
                <Button onClick={() => {}}>Aplicar</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
