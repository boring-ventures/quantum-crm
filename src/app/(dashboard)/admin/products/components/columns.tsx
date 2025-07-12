"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ProductActionsCell } from "./product-actions-cell";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";

export const columns = (
  canEdit: boolean,
  canDelete: boolean,
  onRefresh?: () => void
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return price.toFixed(2);
    },
  },
  {
    accessorKey: "currency",
    header: "Moneda",
    cell: ({ row }) => row.original.currency || "BOB",
  },
  {
    accessorKey: "brand.name",
    header: "Marca",
    cell: ({ row }) => row.original.brand?.name || "-",
  },
  {
    accessorKey: "model.name",
    header: "Modelo",
    cell: ({ row }) => row.original.model?.name || "-",
  },
  {
    accessorKey: "businessType.name",
    header: "Tipo de Negocio",
    cell: ({ row }) => row.original.businessType?.name || "-",
  },
  {
    accessorKey: "country.name",
    header: "País",
    cell: ({ row }) => row.original.country?.name || "-",
  },
  {
    accessorKey: "isActive",
    header: "Estado",
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="success">Activo</Badge>
      ) : (
        <Badge variant="destructive">Inactivo</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return <ProductActionsCell product={product} onRefresh={onRefresh} />;
    },
  },
];
