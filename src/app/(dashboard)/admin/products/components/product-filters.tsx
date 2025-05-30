import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function ProductFilters({
  filters,
  setFilters,
}: {
  filters: any;
  setFilters: (f: any) => void;
}) {
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then(setBrands);
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

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div>
        <label className="block text-xs mb-1">Marca</label>
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
          <SelectTrigger className="min-w-[120px]">
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
      <div>
        <label className="block text-xs mb-1">Modelo</label>
        <Select
          value={filters.modelId ?? "__all__"}
          onValueChange={(v) =>
            setFilters({ ...filters, modelId: v === "__all__" ? undefined : v })
          }
        >
          <SelectTrigger className="min-w-[120px]">
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
      <div>
        <label className="block text-xs mb-1">Estado</label>
        <Select
          value={filters.active ?? "__all__"}
          onValueChange={(v) =>
            setFilters({ ...filters, active: v === "__all__" ? undefined : v })
          }
        >
          <SelectTrigger className="min-w-[100px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">Ordenar por</label>
        <Select
          value={filters.orderBy ?? "__all__"}
          onValueChange={(v) =>
            setFilters({ ...filters, orderBy: v === "__all__" ? undefined : v })
          }
        >
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="Más recientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Más recientes</SelectItem>
            <SelectItem value="price">Precio</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={() => setFilters({})}>
        Limpiar
      </Button>
    </div>
  );
}
