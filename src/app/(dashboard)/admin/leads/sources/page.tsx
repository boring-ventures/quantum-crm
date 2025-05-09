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

// Datos de muestra para fuentes de lead
const LEAD_SOURCES_DATA = [
  {
    id: "1",
    name: "Formulario Web",
    description:
      "Leads que completaron el formulario de contacto del sitio web",
    category: "Sitio Web",
    categoryId: "1",
    costPerLead: 0,
    isActive: true,
  },
  {
    id: "2",
    name: "Facebook Ads",
    description: "Leads generados a través de anuncios en Facebook",
    category: "Redes Sociales",
    categoryId: "2",
    costPerLead: 12.5,
    isActive: true,
  },
  {
    id: "3",
    name: "Google Ads",
    description: "Leads de campañas de búsqueda y display en Google",
    category: "Publicidad Digital",
    categoryId: "3",
    costPerLead: 15.75,
    isActive: true,
  },
  {
    id: "4",
    name: "Feria Automotriz",
    description: "Leads captados en la feria automotriz anual",
    category: "Eventos Presenciales",
    categoryId: "4",
    costPerLead: 50,
    isActive: true,
  },
  {
    id: "5",
    name: "Instagram",
    description: "Leads generados orgánicamente desde Instagram",
    category: "Redes Sociales",
    categoryId: "2",
    costPerLead: 0,
    isActive: true,
  },
  {
    id: "6",
    name: "Recomendación Cliente",
    description: "Leads referidos por clientes actuales",
    category: "Referidos",
    categoryId: "5",
    costPerLead: 0,
    isActive: true,
  },
];

export default function LeadSourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar fuentes por búsqueda
  const filteredSources = LEAD_SOURCES_DATA.filter(
    (source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Fuentes de Lead</h1>
        <p className="text-muted-foreground">
          Gestiona las fuentes específicas como Facebook, Instagram, Google Ads
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar fuentes..."
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
            Agregar Fuente
          </Button>
        </div>
      </div>

      {/* Tabla de fuentes */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Costo por Lead</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  No se encontraron fuentes
                </TableCell>
              </TableRow>
            ) : (
              filteredSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{source.category}</TableCell>
                  <TableCell>
                    {source.costPerLead > 0
                      ? `$${source.costPerLead.toFixed(2)}`
                      : "Gratis"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={source.isActive ? "default" : "destructive"}
                      className={cn(
                        "whitespace-nowrap",
                        source.isActive ? "bg-green-500 hover:bg-green-600" : ""
                      )}
                    >
                      {source.isActive ? "Activo" : "Inactivo"}
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
