"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface SalesPaymentMethodsChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    assignedToIds?: string[];
  };
}

interface PaymentMethodsData {
  methods: Array<{
    paymentMethod: string;
    paymentMethodLabel: string;
    revenue: number;
    salesCount: number;
    percentage: number;
  }>;
}

async function fetchPaymentMethodsData(
  filters: any
): Promise<PaymentMethodsData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));

  const response = await fetch(
    `/api/reports/sales-performance/methods?${params}`
  );
  if (!response.ok) throw new Error("Error fetching payment methods data");

  const result = await response.json();
  return result.data;
}

const PAYMENT_METHOD_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

function CustomTooltip({ active, payload }: any) {
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
          {data.paymentMethodLabel}
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
              Porcentaje:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function PaymentMethodsChartSkeleton() {
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

export function SalesPaymentMethodsChart({
  filters,
}: SalesPaymentMethodsChartProps) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-methods", filters],
    queryFn: () => fetchPaymentMethodsData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <PaymentMethodsChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar métodos de pago
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.methods.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <CardTitle>Métodos de Pago</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No hay datos de métodos de pago disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <CardTitle>Métodos de Pago</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data.methods}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ paymentMethodLabel, percentage }) =>
                `${paymentMethodLabel} (${percentage}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="revenue"
            >
              {data.methods.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    PAYMENT_METHOD_COLORS[index % PAYMENT_METHOD_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
                color: axisColors.text,
              }}
              formatter={(value, entry: any) => (
                <span style={{ color: axisColors.text }}>
                  {entry.payload.paymentMethodLabel}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
