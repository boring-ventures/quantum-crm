"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceCategory } from "@/types/lead";
import { SourceCategoryTable } from "./source-category-table";
import { SourceCategoryDialog } from "./source-category-dialog";
import { SourceCategoryConfirmDelete } from "./source-category-confirm-delete";
import { toast } from "@/components/ui/use-toast";

// Tipo para igualar el FormValues en source-category-dialog.tsx
type SourceCategoryFormValues = {
  name: string;
  description?: string;
  color?: string;
};

export default function SourceCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<SourceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SourceCategory | null>(
    null
  );
  const [deletingCategory, setDeletingCategory] =
    useState<SourceCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Cargar categorías al iniciar
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtrar categorías por búsqueda
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  // Función para obtener todas las categorías
  async function fetchCategories() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/source-categories");
      if (!response.ok) {
        throw new Error("Error al obtener las categorías");
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar las categorías. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Manejar creación/edición
  async function handleSubmit(data: SourceCategoryFormValues) {
    try {
      if (editingCategory) {
        // Actualizar categoría existente
        const response = await fetch(
          `/api/source-categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al actualizar la categoría"
          );
        }

        const updatedCategory = await response.json();

        // Actualizar categoría en la lista local
        setCategories(
          categories.map((category) =>
            category.id === editingCategory.id ? updatedCategory : category
          )
        );
      } else {
        // Crear nueva categoría
        const response = await fetch("/api/source-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear la categoría");
        }

        const newCategory = await response.json();

        // Añadir categoría a la lista local
        setCategories([...categories, newCategory]);
      }

      // Registrar el cambio en el changelog
      await logChange(
        editingCategory ? "Actualización" : "Creación",
        editingCategory ? editingCategory.id : "nueva",
        data.name
      );

      // Resetear estado de edición
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      throw error;
    }
  }

  // Manejar eliminación
  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/source-categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la categoría");
      }

      // Si la respuesta contiene un mensaje específico, es porque se marcó como inactiva
      const result = await response.json();

      if (result.isActive === false) {
        // La categoría fue marcada como inactiva
        setCategories(
          categories.map((category) =>
            category.id === id ? { ...category, isActive: false } : category
          )
        );
      } else {
        // La categoría fue eliminada
        setCategories(categories.filter((category) => category.id !== id));
      }

      // Registrar el cambio en el changelog
      await logChange(
        "Eliminación",
        id,
        deletingCategory?.name || "desconocida"
      );

      // Resetear estado de eliminación
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  // Función para registrar cambios en el changelog
  async function logChange(action: string, id: string, name: string) {
    const date = new Date().toISOString().split("T")[0];
    const entry = `[${date}] [Schema] - ${action} de categoría de fuente: ${name} (ID: ${id})`;

    console.log("Cambio registrado:", entry);
    // Aquí se podría implementar la lógica para escribir en el archivo CHANGELOG-QUANTUM.txt
  }

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
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Categoría
          </Button>
        </div>
      </div>

      {/* Tabla de categorías */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Cargando categorías...</p>
        </div>
      ) : (
        <SourceCategoryTable
          categories={filteredCategories}
          onEdit={(category) => {
            setEditingCategory(category);
            setDialogOpen(true);
          }}
          onDelete={(category) => {
            setDeletingCategory(category);
            setDeleteDialogOpen(true);
          }}
        />
      )}

      {/* Diálogos */}
      <SourceCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingCategory}
        onSubmit={handleSubmit}
      />

      <SourceCategoryConfirmDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={deletingCategory}
        onConfirm={handleDelete}
      />
    </div>
  );
}
