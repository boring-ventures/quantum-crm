"use client";

import {
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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

// Datos de muestra para estados de lead
const LEAD_STATUSES_DATA = [
  {
    id: "1",
    name: "Nuevo",
    color: "#3498db",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "2",
    name: "Contactado",
    color: "#f39c12",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "3",
    name: "En Seguimiento",
    color: "#9b59b6",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "4",
    name: "Negociación",
    color: "#e74c3c",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "5",
    name: "Cerrado Ganado",
    color: "#2ecc71",
    displayOrder: 5,
    isActive: true,
  },
  {
    id: "6",
    name: "Cerrado Perdido",
    color: "#7f8c8d",
    displayOrder: 6,
    isActive: false,
  },
];

export default function LeadStatusesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar estados por búsqueda
  const filteredStatuses = LEAD_STATUSES_DATA.filter((status) =>
    status.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Estados de Lead</h1>
        <p className="text-muted-foreground">
          Configura los estados por los que pasa un lead en el proceso de venta
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar estados..."
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
            Agregar Estado
          </Button>
        </div>
      </div>

      {/* Tabla de estados */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStatuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  No se encontraron estados
                </TableCell>
              </TableRow>
            ) : (
              filteredStatuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="w-24">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{status.displayOrder}</span>
                      <div className="flex flex-col space-y-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{status.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-5 w-5 rounded"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={status.isActive ? "default" : "destructive"}
                      className={cn(
                        "whitespace-nowrap",
                        status.isActive ? "bg-green-500 hover:bg-green-600" : ""
                      )}
                    >
                      {status.isActive ? "Activo" : "Inactivo"}
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
