"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { useChartColors } from "@/lib/utils/chart-colors";

interface PaymentMethodsChartProps {
  filters: {
    startDate?: string;
    endDate?: string;
    countryIds?: string[];
    assignedToIds?: string[];
    currency?: string;
  };
}

interface PaymentMethodData {
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
}

async function fetchPaymentMethodsData(
  filters: any
): Promise<PaymentMethodData> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.currency) params.append("currency", filters.currency);

  const response = await fetch(
    `/api/reports/sales-performance/methods?${params}`
  );
  if (!response.ok) throw new Error("Error fetching payment methods data");

  const result = await response.json();
  return result.data;
}

// Payment method translations
const paymentMethodTranslations: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CHECK: "Cheque",
  FINANCING: "Financiamiento",
};

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
          {data.method}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ventas:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.count}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Porcentaje:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              {data.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: axisColors.text }} className="opacity-70">
              Ingresos:
            </span>
            <span className="font-medium" style={{ color: axisColors.text }}>
              ${data.revenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function CustomLegend({ payload }: any) {
  const { getChartAxisColors } = useChartColors();
  const axisColors = getChartAxisColors();

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: axisColors.text }}
          >
            {entry.value} ({entry.payload.percentage.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
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
}: PaymentMethodsChartProps) {
  const { getColor, getChartAxisColors } = useChartColors();
  const axisColors = useMemo(() => getChartAxisColors(), [getChartAxisColors]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-payment-methods", filters],
    queryFn: () => fetchPaymentMethodsData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Define colors for each payment method
  const colors = useMemo(
    () => ({
      Efectivo: getColor("green"),
      Tarjeta: getColor("blue"),
      Transferencia: getColor("purple"),
      Cheque: getColor("orange"),
      Financiamiento: getColor("red"),
    }),
    [getColor]
  );

  if (isLoading) {
    return <PaymentMethodsChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Error al cargar datos de métodos de pago
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.paymentMethods.length) {
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

  // Transform data for the chart
  const chartData = data.paymentMethods.map((method) => ({
    method: paymentMethodTranslations[method.method] || method.method,
    count: method.count,
    percentage: method.percentage,
    revenue: method.revenue,
  }));

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
              data={chartData}
              cx="50%"
              cy="40%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    colors[entry.method as keyof typeof colors] ||
                    colors["Efectivo"]
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
