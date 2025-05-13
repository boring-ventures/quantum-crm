"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
import { LeadStatus } from "@/types/lead";
import { LeadStatusTable } from "./lead-status-table";
import { LeadStatusDialog } from "./lead-status-dialog";
import { LeadStatusConfirmDelete } from "./lead-status-confirm-delete";
import { toast } from "@/components/ui/use-toast";

// Definir tipo para igualar el FormValues en lead-status-dialog.tsx
type LeadStatusFormValues = {
  name: string;
  description?: string;
  color: string;
  displayOrder?: number;
};

// Forzar renderizado dinámico para evitar errores con cookies()
export const dynamic = "force-dynamic";

export default function LeadStatusesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState<LeadStatus | null>(null);

  // Filtrar estados por búsqueda
  const filteredStatuses = statuses.filter((status) =>
    status.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar estados
  useEffect(() => {
    async function loadStatuses() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/lead-statuses");
        if (!response.ok) throw new Error("Error al cargar los estados");

        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error("Error loading statuses:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los estados de lead",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadStatuses();
  }, [toast]);

  // Manejar creación/edición
  async function handleSubmit(data: LeadStatusFormValues) {
    try {
      // Filtrar campos undefined para permitir que la API calcule valores automáticos
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      if (editingStatus) {
        // Actualizar estado existente
        const response = await fetch(`/api/lead-statuses/${editingStatus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar el estado");
        }

        const updatedStatus = await response.json();

        // Actualizar estado en la lista local
        setStatuses(
          statuses.map((status) =>
            status.id === editingStatus.id ? updatedStatus : status
          )
        );
      } else {
        // Crear nuevo estado
        const response = await fetch("/api/lead-statuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear el estado");
        }

        const newStatus = await response.json();

        // Añadir estado a la lista local
        setStatuses([...statuses, newStatus]);
      }

      // Resetear estado de edición
      setEditingStatus(null);
    } catch (error) {
      console.error("Error saving status:", error);
      throw error;
    }
  }

  // Manejar eliminación (soft delete)
  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/lead-statuses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el estado");
      }

      // Si la eliminación es exitosa, actualizar la lista
      setStatuses(
        statuses.map((status) =>
          status.id === id ? { ...status, isActive: false } : status
        )
      );
    } catch (error) {
      console.error("Error deleting status:", error);
      throw error;
    }
  }

  // Manejar cambio de orden
  async function handleOrderChange(id: string, direction: "up" | "down") {
    try {
      const statusIndex = statuses.findIndex((s) => s.id === id);
      if (statusIndex === -1) return;

      // No permitir mover más allá de los límites
      if (
        (direction === "up" && statusIndex === 0) ||
        (direction === "down" && statusIndex === statuses.length - 1)
      ) {
        return;
      }

      const targetIndex =
        direction === "up" ? statusIndex - 1 : statusIndex + 1;
      const currentStatus = statuses[statusIndex];
      const targetStatus = statuses[targetIndex];

      // Intercambiar órdenes
      const newStatuses = [...statuses];

      // Actualizar en la API
      const promises = [
        fetch(`/api/lead-statuses/${currentStatus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: targetStatus.displayOrder }),
        }),
        fetch(`/api/lead-statuses/${targetStatus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: currentStatus.displayOrder }),
        }),
      ];

      await Promise.all(promises);

      // Actualizar en el estado local
      newStatuses[statusIndex] = {
        ...currentStatus,
        displayOrder: targetStatus.displayOrder,
      };
      newStatuses[targetIndex] = {
        ...targetStatus,
        displayOrder: currentStatus.displayOrder,
      };

      // Ordenar por displayOrder
      newStatuses.sort((a, b) => a.displayOrder - b.displayOrder);

      setStatuses(newStatuses);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el orden",
      });
    }
  }

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
          <Button
            size="sm"
            onClick={() => {
              setEditingStatus(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Estado
          </Button>
        </div>
      </div>

      {/* Tabla de estados */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Cargando estados...</p>
        </div>
      ) : (
        <LeadStatusTable
          statuses={filteredStatuses}
          onEdit={(status) => {
            setEditingStatus(status);
            setDialogOpen(true);
          }}
          onDelete={(status) => {
            setDeletingStatus(status);
            setDeleteDialogOpen(true);
          }}
          onOrderChange={handleOrderChange}
        />
      )}

      {/* Diálogos */}
      <LeadStatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingStatus}
        onSubmit={handleSubmit}
      />

      <LeadStatusConfirmDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        status={deletingStatus}
        onConfirm={handleDelete}
      />
    </div>
  );
}
