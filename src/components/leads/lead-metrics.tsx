"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, UserCheck, UserPlus, Users } from "lucide-react";

// Definir el tipo para las métricas
type Metric = {
  name: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  change: number;
};

// Datos de ejemplo para las métricas
const metrics: Metric[] = [
  {
    name: "Leads Nuevos",
    value: "24",
    description: "Este mes",
    icon: <UserPlus className="h-4 w-4 text-blue-500" />,
    change: 12.5,
  },
  {
    name: "Leads Activos",
    value: "132",
    description: "Total",
    icon: <Users className="h-4 w-4 text-purple-500" />,
    change: 3.2,
  },
  {
    name: "Conversiones",
    value: "8",
    description: "Este mes",
    icon: <UserCheck className="h-4 w-4 text-green-500" />,
    change: -4.1,
  },
  {
    name: "Valor Estimado",
    value: "$32,500",
    description: "En proceso",
    icon: <CircleDollarSign className="h-4 w-4 text-yellow-500" />,
    change: 8.3,
  },
];

export function LeadMetrics() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-200">
              {metric.name}
            </CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-gray-400 mt-1">
              {metric.description}
              <span
                className={`inline-block ml-2 ${
                  metric.change > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {metric.change > 0 ? "+" : ""}
                {metric.change}%
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
