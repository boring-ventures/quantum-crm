"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { MetricConfig } from "@/types/reports";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  metric: MetricConfig;
}

// Icon mapping for client-side rendering
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
};

export function MetricCard({ metric }: MetricCardProps) {
  const router = useRouter();
  const IconComponent = iconMap[metric.iconName];

  const handleNavigate = () => {
    router.push(metric.route);
  };

  if (!IconComponent) {
    console.warn(`Icon ${metric.iconName} not found in iconMap`);
    return null;
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        metric.hoverShadow,
        "cursor-pointer"
      )}
      onClick={handleNavigate}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300",
          metric.gradientFrom,
          metric.gradientTo,
          "group-hover:opacity-70"
        )}
      />

      {/* Card Content */}
      <div className="relative z-10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "p-3 rounded-lg transition-colors duration-300",
                metric.colorTheme === "blue" &&
                  "bg-blue-100 dark:bg-blue-900/30",
                metric.colorTheme === "green" &&
                  "bg-green-100 dark:bg-green-900/30",
                metric.colorTheme === "purple" &&
                  "bg-purple-100 dark:bg-purple-900/30",
                metric.colorTheme === "orange" &&
                  "bg-orange-100 dark:bg-orange-900/30"
              )}
            >
              <IconComponent
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  metric.colorTheme === "blue" &&
                    "text-blue-600 dark:text-blue-400",
                  metric.colorTheme === "green" &&
                    "text-green-600 dark:text-green-400",
                  metric.colorTheme === "purple" &&
                    "text-purple-600 dark:text-purple-400",
                  metric.colorTheme === "orange" &&
                    "text-orange-600 dark:text-orange-400"
                )}
              />
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
          </div>

          <CardTitle className="text-xl font-semibold tracking-tight">
            {metric.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            {metric.description}
          </CardDescription>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "transition-all duration-300 border-transparent",
                "group-hover:border-current",
                metric.colorTheme === "blue" &&
                  "group-hover:text-blue-600 group-hover:border-blue-200 dark:group-hover:text-blue-400 dark:group-hover:border-blue-800",
                metric.colorTheme === "green" &&
                  "group-hover:text-green-600 group-hover:border-green-200 dark:group-hover:text-green-400 dark:group-hover:border-green-800",
                metric.colorTheme === "purple" &&
                  "group-hover:text-purple-600 group-hover:border-purple-200 dark:group-hover:text-purple-400 dark:group-hover:border-purple-800",
                metric.colorTheme === "orange" &&
                  "group-hover:text-orange-600 group-hover:border-orange-200 dark:group-hover:text-orange-400 dark:group-hover:border-orange-800"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
            >
              Ver Reportes
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
