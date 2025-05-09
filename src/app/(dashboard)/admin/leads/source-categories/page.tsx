"use client";

import { Search, Plus, Filter, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Datos de muestra para categorías de fuente
const SOURCE_CATEGORIES_DATA = [
  {
    id: "1",
    name: "Sitio Web",
    description: "Leads generados a través del sitio web corporativo",
    color: "#3498db",
    isActive: true,
  },
  {
    id: "2",
    name: "Redes Sociales",
    description: "Leads de diversas plataformas de redes sociales",
    color: "#e74c3c",
    isActive: true,
  },
  {
    id: "3",
    name: "Publicidad Digital",
    description: "Leads de campañas de marketing digital",
    color: "#2ecc71",
    isActive: true,
  },
  {
    id: "4",
    name: "Eventos Presenciales",
    description: "Leads obtenidos en ferias, exposiciones y eventos",
    color: "#f39c12",
    isActive: true,
  },
  {
    id: "5",
    name: "Referidos",
    description: "Leads referidos por clientes existentes",
    color: "#9b59b6",
    isActive: true,
  },
];

export default function SourceCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar categorías por búsqueda
  const filteredCategories = SOURCE_CATEGORIES_DATA.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Categorías de Fuente</h1>
        <p className="text-muted-foreground">
          Agrupa las fuentes de leads como Sitio Web, Publicidad Digital,
          Evento, etc.
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar categorías..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Categoría
          </Button>
        </div>
      </div>

      {/* Tabla de categorías */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  No se encontraron categorías
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-5 w-5 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.isActive ? "default" : "destructive"}
                      className={cn(
                        "whitespace-nowrap",
                        category.isActive
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      )}
                    >
                      {category.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                        >
                          <span className="sr-only">Abrir menú</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
