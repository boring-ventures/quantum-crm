"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ProductActionsCell } from "./product-actions-cell";
import { formatCurrency } from "@/lib/utils";

export type Product = {
  id: string;
  code: string;
  name: string;
  nameProduct: string;
  descriptionProduct?: string;
  price?: number;
  isActive: boolean;
  brand?: {
    name: string;
    company?: {
      name: string;
    };
  };
  model?: {
    name: string;
  };
  businessType?: {
    name: string;
  };
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "nameProduct",
    header: "Versión",
  },
  {
    accessorKey: "brand.name",
    header: "Marca",
    cell: ({ row }) => {
      const brand = row.original.brand;
      return brand ? brand.name : "-";
    },
  },
  {
    accessorKey: "model.name",
    header: "Modelo",
    cell: ({ row }) => {
      const model = row.original.model;
      return model ? model.name : "-";
    },
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => {
      const price = row.original.price;
      return price ? formatCurrency(price) : "-";
    },
  },
  {
    accessorKey: "isActive",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ProductActionsCell product={row.original} />,
  },
];
