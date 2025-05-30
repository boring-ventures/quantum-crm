"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Globe, Pencil, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/utils/permissions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { CountryTable } from "./country-table";
import { CountryDialog } from "./country-dialog";
import { DeleteCountryDialog } from "./delete-country-dialog";
import { Country } from "@/types/country";
import { useUserStore } from "@/store/userStore";

export default function CountriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCountry, setDeletingCountry] = useState<Country | null>(null);

  // Permisos
  const canCreateCountries = hasPermission(currentUser, "countries", "create");
  const canEditCountries = hasPermission(currentUser, "countries", "edit");
  const canDeleteCountries = hasPermission(currentUser, "countries", "delete");
  const canViewCountries = hasPermission(currentUser, "countries", "view");

  // Validar acceso a la página
  if (!canViewCountries) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
      </div>
    );
  }

  // Filtrar países por búsqueda
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar países
  useEffect(() => {
    async function loadCountries() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/countries");
        if (!response.ok) throw new Error("Error al cargar los países");

        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error("Error loading countries:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los países",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadCountries();
  }, []);

  // Manejar creación/edición
  async function handleSubmit(data: { name: string; code: string }) {
    try {
      if (editingCountry) {
        if (!canEditCountries) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No tienes permisos para editar países",
          });
          return;
        }

        // Actualizar país existente
        const response = await fetch(
          `/api/admin/countries/${editingCountry.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar el país");
        }

        const updatedCountry = await response.json();

        // Actualizar país en la lista local
        setCountries(
          countries.map((country) =>
            country.id === editingCountry.id ? updatedCountry : country
          )
        );

        toast({
          title: "País actualizado",
          description: "El país ha sido actualizado exitosamente.",
        });
      } else {
        if (!canCreateCountries) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No tienes permisos para crear países",
          });
          return;
        }

        // Crear nuevo país
        const response = await fetch("/api/admin/countries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear el país");
        }

        const newCountry = await response.json();

        // Añadir país a la lista local
        setCountries([...countries, newCountry]);

        toast({
          title: "País creado",
          description: "El país ha sido creado exitosamente.",
        });
      }

      // Resetear estado de edición y cerrar diálogo
      setEditingCountry(null);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving country:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar el país",
      });
    }
  }

  // Manejar eliminación
  async function handleDelete(id: string) {
    if (!canDeleteCountries) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes permisos para eliminar países",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/countries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el país");
      }

      // Si la eliminación es exitosa, actualizar la lista
      setCountries(countries.filter((country) => country.id !== id));

      toast({
        title: "País eliminado",
        description: "El país ha sido eliminado exitosamente.",
      });

      // Cerrar el diálogo de confirmación
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting country:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar el país",
      });
    }
  }

  function handleOpenCreateDialog() {
    if (!canCreateCountries) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes permisos para crear países",
      });
      return;
    }
    setEditingCountry(null);
    setDialogOpen(true);
  }

  function handleOpenEditDialog(country: Country) {
    if (!canEditCountries) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes permisos para editar países",
      });
      return;
    }
    setEditingCountry(country);
    setDialogOpen(true);
  }

  function handleOpenDeleteDialog(country: Country) {
    if (!canDeleteCountries) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes permisos para eliminar países",
      });
      return;
    }
    setDeletingCountry(country);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administración de Países</h1>
        {canCreateCountries && (
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo País
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar países..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <CountryTable
        countries={filteredCountries}
        isLoading={isLoading}
        onEdit={canEditCountries ? handleOpenEditDialog : undefined}
        onDelete={canDeleteCountries ? handleOpenDeleteDialog : undefined}
      />

      {dialogOpen && (
        <CountryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          country={editingCountry}
          onSubmit={handleSubmit}
        />
      )}

      {deletingCountry && (
        <DeleteCountryDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          country={deletingCountry}
          onConfirmDelete={() => handleDelete(deletingCountry.id)}
        />
      )}
    </div>
  );
}
