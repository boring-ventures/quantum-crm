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

// Datos de muestra para motivos de cierre
const CLOSURE_REASONS_DATA = [
  {
    id: "1",
    name: "Venta Completada",
    description: "Lead convertido en cliente, compra finalizada",
    type: "Positivo",
    isActive: true,
  },
  {
    id: "2",
    name: "Fuera de Presupuesto",
    description: "El cliente no tiene presupuesto suficiente",
    type: "Negativo",
    isActive: true,
  },
  {
    id: "3",
    name: "Compró con la Competencia",
    description: "El cliente eligió un producto o servicio de la competencia",
    type: "Negativo",
    isActive: true,
  },
  {
    id: "4",
    name: "Sin Interés",
    description: "El lead no mostró interés en nuestros productos",
    type: "Negativo",
    isActive: true,
  },
  {
    id: "5",
    name: "Solicitud de Financiamiento Aprobada",
    description: "El lead obtuvo financiamiento para la compra",
    type: "Positivo",
    isActive: true,
  },
  {
    id: "6",
    name: "Datos Incorrectos",
    description: "La información de contacto proporcionada es incorrecta",
    type: "Negativo",
    isActive: true,
  },
  {
    id: "7",
    name: "Sólo Buscaba Información",
    description:
      "El lead sólo requería información, no tenía intención de compra",
    type: "Negativo",
    isActive: true,
  },
];

export default function ClosureReasonsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar motivos por búsqueda
  const filteredReasons = CLOSURE_REASONS_DATA.filter(
    (reason) =>
      reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Motivos de Cierre</h1>
        <p className="text-muted-foreground">
          Gestiona los motivos de cierre para tus leads
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar motivos..."
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
            Agregar Motivo
          </Button>
        </div>
      </div>

      {/* Tabla de motivos de cierre */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  No se encontraron motivos
                </TableCell>
              </TableRow>
            ) : (
              filteredReasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell className="font-medium">{reason.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {reason.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        reason.type === "Positivo"
                          ? "border-green-500 text-green-500"
                          : "border-red-500 text-red-500"
                      )}
                    >
                      {reason.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={reason.isActive ? "default" : "destructive"}
                      className={cn(
                        "whitespace-nowrap",
                        reason.isActive ? "bg-green-500 hover:bg-green-600" : ""
                      )}
                    >
                      {reason.isActive ? "Activo" : "Inactivo"}
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
