"use client";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadSource } from "@/types/lead";

interface LeadSourceTableProps {
  sources: LeadSource[];
  onEdit: (source: LeadSource) => void;
  onDelete: (source: LeadSource) => void;
}

export function LeadSourceTable({
  sources,
  onEdit,
  onDelete,
}: LeadSourceTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Costo por Lead</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                No se encontraron fuentes
              </TableCell>
            </TableRow>
          ) : (
            sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">{source.name}</TableCell>
                <TableCell>{source.description}</TableCell>
                <TableCell>
                  {source.category?.name || "Sin categoría"}
                </TableCell>
                <TableCell>
                  {source.costPerLead
                    ? `$${parseFloat(source.costPerLead.toString()).toFixed(2)}`
                    : "N/A"}
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
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(source)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(source)}
                      >
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
  );
}
