"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadSource } from "@/types/lead";
import { LeadSourceTable } from "./lead-source-table";
import { LeadSourceDialog } from "./lead-source-dialog";
import { LeadSourceConfirmDelete } from "./lead-source-confirm-delete";
import { toast } from "@/components/ui/use-toast";

// Tipo para igualar el FormValues en lead-source-dialog.tsx
type LeadSourceFormValues = {
  name: string;
  description?: string;
  categoryId?: string | null;
  costPerLead?: string | number | null;
  isActive: boolean;
};

export default function LeadSourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<LeadSource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Consultar las fuentes de lead
  const { data: sources, isLoading } = useQuery<LeadSource[]>({
    queryKey: ["leadSources"],
    queryFn: async () => {
      const response = await fetch("/api/lead-sources");
      if (!response.ok) {
        throw new Error("Error al obtener las fuentes");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar fuentes por búsqueda
  const filteredSources =
    sources?.filter(
      (source) =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (source.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
    ) || [];

  // Manejar creación/edición
  async function handleSubmit(data: LeadSourceFormValues) {
    try {
      // Crear una copia de los datos para no modificar el original
      const submissionData = { ...data };

      // Convertir costPerLead a número si existe
      if (submissionData.costPerLead) {
        submissionData.costPerLead = parseFloat(
          submissionData.costPerLead.toString()
        );
      }

      // Determinar el endpoint y método según si estamos editando o creando
      const endpoint = editingSource
        ? `/api/lead-sources/${editingSource.id}`
        : "/api/lead-sources";
      const method = editingSource ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Error al ${editingSource ? "actualizar" : "crear"} la fuente`
        );
      }

      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ["leadSources"] });

      // Registrar el cambio en el changelog
      await logChange(
        editingSource ? "Actualización" : "Creación",
        editingSource ? editingSource.id : "nueva",
        data.name
      );

      // Resetear estado de edición
      setEditingSource(null);
    } catch (error) {
      console.error("Error saving source:", error);
      throw error;
    }
  }

  // Manejar eliminación (desactivación)
  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/lead-sources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la fuente");
      }

      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ["leadSources"] });

      // Registrar el cambio en el changelog
      await logChange("Eliminación", id, deletingSource?.name || "desconocida");

      // Resetear estado de eliminación
      setDeletingSource(null);
    } catch (error) {
      console.error("Error deleting source:", error);
      throw error;
    }
  }

  // Función para registrar cambios en el changelog
  async function logChange(action: string, id: string, name: string) {
    const date = new Date().toISOString().split("T")[0];
    const entry = `[${date}] [Schema] - ${action} de fuente de lead: ${name} (ID: ${id})`;

    console.log("Cambio registrado:", entry);
    // Aquí se podría implementar la lógica para escribir en el archivo CHANGELOG-QUANTUM.txt
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Fuentes de Lead</h1>
        <p className="text-muted-foreground">
          Administra las fuentes desde donde se originan los leads, como sitio
          web, publicidad, etc.
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
          <Button
            size="sm"
            onClick={() => {
              setEditingSource(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Fuente
          </Button>
        </div>
      </div>

      {/* Tabla de fuentes */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Cargando fuentes...</p>
        </div>
      ) : (
        <LeadSourceTable
          sources={filteredSources}
          onEdit={(source) => {
            setEditingSource(source);
            setDialogOpen(true);
          }}
          onDelete={(source) => {
            setDeletingSource(source);
            setDeleteDialogOpen(true);
          }}
        />
      )}

      {/* Diálogos */}
      <LeadSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingSource}
        onSubmit={handleSubmit}
      />

      <LeadSourceConfirmDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        source={deletingSource}
        onConfirm={handleDelete}
      />
    </div>
  );
}
