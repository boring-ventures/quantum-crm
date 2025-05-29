"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ProductActionsCell } from "./product-actions-cell";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export const columns = (
  canEdit: boolean,
  canDelete: boolean
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
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
      }).format(price);
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon">
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
