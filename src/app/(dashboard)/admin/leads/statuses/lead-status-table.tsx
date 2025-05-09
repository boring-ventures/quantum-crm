"use client";

import { useEffect, useState } from "react";
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
import { Pencil, Trash2, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadStatus } from "@/types/lead";
import { useRouter } from "next/navigation";

interface LeadStatusTableProps {
  statuses: LeadStatus[];
  onEdit: (status: LeadStatus) => void;
  onDelete: (status: LeadStatus) => void;
  onOrderChange: (id: string, direction: "up" | "down") => void;
}

export function LeadStatusTable({
  statuses,
  onEdit,
  onDelete,
  onOrderChange,
}: LeadStatusTableProps) {
  const router = useRouter();

  const handleOrderChange = async (id: string, direction: "up" | "down") => {
    onOrderChange(id, direction);
  };

  return (
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
          {statuses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                No se encontraron estados
              </TableCell>
            </TableRow>
          ) : (
            statuses.map((status, index) => (
              <TableRow key={status.id}>
                <TableCell className="w-24">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{status.displayOrder}</span>
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleOrderChange(status.id, "up")}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === statuses.length - 1}
                        onClick={() => handleOrderChange(status.id, "down")}
                      >
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
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(status)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(status)}
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
