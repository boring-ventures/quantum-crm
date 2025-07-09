"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMemo } from "react";
import { Package } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface SalesProductsChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    assignedToIds?: string[];
    currency?: string;
  };
}

interface ProductsData {
  products: Array<{
    name: string;
    revenue: number;
    salesCount: number;
    avgPrice: number;
  }>;
}

async function fetchProductsData(filters: any): Promise<ProductsData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.currency) params.append("currency", filters.currency);

  const response = await fetch(
    `/api/reports/sales-performance/products?${params}`
  );
  if (!response.ok) throw new Error("Error fetching products data");

  const result = await response.json();
  return result.data;
}

function CustomTooltip({ active, payload, label }: any) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = getChartAxisColors();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="border rounded-lg shadow-lg p-3 max-w-xs"
        style={{ backgroundColor: axisColors.background }}
      >
        <p className="font-medium mb-2" style={{ color: axisColors.text }}>
          {label}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ingresos:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              ${data.revenue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ventas:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.salesCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Precio Promedio:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              ${data.avgPrice.toLocaleString()}
            </span>
          </div>
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
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

export function SalesProductsChart({ filters }: SalesProductsChartProps) {
  const { getColor, getChartAxisColors } = useChartColors();
  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);
  const orangeColor = useMemo(() => getColor("orange"), [getColor]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-products", filters],
    queryFn: () => fetchProductsData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <ProductsChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar datos de productos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.products.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            <CardTitle>Top Productos por Ingresos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No hay datos de productos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have valid data and truncate long product names
  const processedData = data.products
    .map((product) => ({
      ...product,
      name:
        product.name.length > 15
          ? `${product.name.substring(0, 15)}...`
          : product.name,
      revenue: Number(product.revenue) || 0,
    }))
    .filter((product) => product.revenue > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" />
          <CardTitle>Top Productos por Ingresos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={processedData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={axisColors.grid}
              opacity={0.3}
              horizontal={true}
            />
            <XAxis
              type="number"
              tick={{ fill: axisColors.text, fontSize: 11 }}
              tickMargin={8}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: axisColors.text, fontSize: 11 }}
              tickMargin={8}
              axisLine={{ stroke: axisColors.grid }}
              tickLine={{ stroke: axisColors.grid }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              fill={orangeColor}
              radius={[0, 4, 4, 0]}
              minPointSize={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
