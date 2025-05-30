"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuotationProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface QuotationProductsTableProps {
  products: QuotationProduct[];
  className?: string;
  onPriceChange?: (productId: string, newPrice: number) => void;
}

export function QuotationProductsTable({
  products,
  className,
  onPriceChange,
}: QuotationProductsTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: string }>(
    {}
  );

  const handlePriceChange = (productId: string, value: string) => {
    setEditingPrice((prev) => ({ ...prev, [productId]: value }));

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && onPriceChange) {
      onPriceChange(productId, numValue);
    }
  };

  const total = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Datos del producto <span className="text-red-500">*</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">
                  Precio Unit. <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Label
                        htmlFor={`price-${product.id}`}
                        className="sr-only"
                      >
                        Precio unitario
                      </Label>
                      <Input
                        id={`price-${product.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPrice[product.id] ?? product.price}
                        onChange={(e) =>
                          handlePriceChange(product.id, e.target.value)
                        }
                        className="w-24 text-right"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(product.quantity * product.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
