"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { columns } from "./components/columns";
import { ProductsCreateDialog } from "./components/products-create-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";

export default function ProductsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { user: currentUser } = useUserStore();

  // Permisos
  const canCreateProducts = hasPermission(currentUser, "products", "create");
  const canEditProducts = hasPermission(currentUser, "products", "edit");
  const canDeleteProducts = hasPermission(currentUser, "products", "delete");
  const canViewProducts = hasPermission(currentUser, "products", "view");

  // Validar acceso a la página
  if (!canViewProducts) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
      </div>
    );
  }

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/products?search=${debouncedSearchTerm}`
      );
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los productos",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = useCallback(() => {
    if (!canCreateProducts) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes permisos para crear productos",
      });
      return;
    }
    setShowCreateDialog(true);
  }, [canCreateProducts, toast]);

  const handleCreateSuccess = useCallback(() => {
    fetchProducts();
    setShowCreateDialog(false);
    toast({
      title: "Éxito",
      description: "Producto creado correctamente",
    });
  }, [fetchProducts, toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Gestión de Productos"
        description="Administra el catálogo de productos y su inventario"
      />

      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canCreateProducts && (
          <Button onClick={handleCreateProduct}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            Lista de todos los productos en el catálogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns(canEditProducts, canDeleteProducts)}
            data={products}
            isLoading={isLoading}
            noResultsMessage="No se encontraron productos"
          />
        </CardContent>
      </Card>

      {showCreateDialog && (
        <ProductsCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
