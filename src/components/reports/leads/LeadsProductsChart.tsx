"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { Package, Layers, Award } from "lucide-react";

interface LeadsProductsChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    sourceIds?: string[];
    assignedToId?: string;
  };
}

interface ProductsData {
  products: Array<{
    id?: string;
    name: string;
    businessType?: string;
    brand?: string;
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    avgPrice?: number | null;
    productCount?: number;
  }>;
  summary: {
    totalProducts: number;
    totalLeads: number;
    totalQualified: number;
    overallConversionRate: number;
  };
  groupBy: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

async function fetchProductsData(
  filters: any,
  groupBy: string
): Promise<ProductsData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);
  params.append("groupBy", groupBy);

  const response = await fetch(
    `/api/reports/leads-analytics/products?${params}`
  );
  if (!response.ok) throw new Error("Error fetching products data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[250px]">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-orange-600" />
          <p className="font-medium">{data.name}</p>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Leads:</span>
            <span className="font-medium">{data.totalLeads}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leads Calificados:</span>
            <span className="font-medium">{data.qualifiedLeads}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa Conversión:</span>
            <span className="font-medium">{data.conversionRate}%</span>
          </div>
          {data.businessType && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de Negocio:</span>
              <span className="font-medium">{data.businessType}</span>
            </div>
          )}
          {data.brand && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marca:</span>
              <span className="font-medium">{data.brand}</span>
            </div>
          )}
          {data.avgPrice && (
            <div className="flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Precio Promedio:</span>
              <span className="font-medium">
                ${data.avgPrice.toLocaleString()}
              </span>
            </div>
          )}
          {data.productCount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Productos:</span>
              <span className="font-medium">{data.productCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function ProductsChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}

function SummaryStats({
  summary,
  groupBy,
}: {
  summary: ProductsData["summary"];
  groupBy: string;
}) {
  const getLabel = () => {
    switch (groupBy) {
      case "businessType":
        return "Tipos de Negocio";
      case "brand":
        return "Marcas";
      default:
        return "Productos";
    }
  };

  return (
    <div className="flex gap-6 text-center">
      <div>
        <p className="text-2xl font-bold text-orange-600">
          {summary.totalProducts}
        </p>
        <p className="text-xs text-muted-foreground">{getLabel()}</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-blue-600">
          {summary.totalLeads.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">Total Leads</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-600">
          {summary.overallConversionRate}%
        </p>
        <p className="text-xs text-muted-foreground">Conversión Promedio</p>
      </div>
    </div>
  );
}

export function LeadsProductsChart({ filters }: LeadsProductsChartProps) {
  const [groupBy, setGroupBy] = useState<"product" | "businessType" | "brand">(
    "product"
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads-products", filters, groupBy],
    queryFn: () => fetchProductsData(filters, groupBy),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleGroupByChange = (value: string) => {
    if (value === "product" || value === "businessType" || value === "brand") {
      setGroupBy(value);
    }
  };

  if (isLoading) {
    return <ProductsChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar análisis de productos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Producto</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No hay datos de productos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = () => {
    switch (groupBy) {
      case "businessType":
        return Layers;
      case "brand":
        return Award;
      default:
        return Package;
    }
  };

  const IconComponent = getIcon();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-orange-600" />
            <CardTitle>
              Análisis por{" "}
              {groupBy === "businessType"
                ? "Tipo de Negocio"
                : groupBy === "brand"
                  ? "Marca"
                  : "Producto"}
            </CardTitle>
          </div>
          <Select value={groupBy} onValueChange={handleGroupByChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Por Producto</SelectItem>
              <SelectItem value="businessType">Por Tipo</SelectItem>
              <SelectItem value="brand">Por Marca</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SummaryStats summary={data.summary} groupBy={groupBy} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data.products}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-muted-foreground text-xs"
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis className="text-muted-foreground text-xs" tickMargin={8} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalLeads"
              fill="hsl(var(--orange-500))"
              radius={[4, 4, 0, 0]}
              name="Total Leads"
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Top Products Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.slice(0, 3).map((product, index) => (
            <div
              key={product.id || product.name}
              className="p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <div className="text-right">
                  <p className="font-medium">{product.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">leads</p>
                </div>
              </div>
              <h4
                className="font-medium text-sm mb-2 truncate"
                title={product.name}
              >
                {product.name}
              </h4>
              <div className="space-y-1 text-xs">
                {product.businessType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{product.businessType}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marca:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversión:</span>
                  <span className="font-medium">{product.conversionRate}%</span>
                </div>
                {product.avgPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span>${product.avgPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
