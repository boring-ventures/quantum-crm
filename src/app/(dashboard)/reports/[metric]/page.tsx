import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMetricByRoute, getValidMetricIds } from "@/lib/reports/config";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { LeadsAnalyticsDashboard } from "@/components/reports/leads/LeadsAnalyticsDashboard";
import { SalesPerformanceDashboard } from "@/components/reports/sales/SalesPerformanceDashboard";

// Icon mapping for client-side rendering
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
};

interface MetricPageProps {
  params: Promise<{
    metric: string;
  }>;
}

// Loading skeleton for the metric page
function MetricPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// Main content component
async function MetricContent({ metric }: { metric: string }) {
  // Validate the metric parameter
  const validMetricIds = getValidMetricIds();
  if (!validMetricIds.includes(metric)) {
    notFound();
  }

  const metricConfig = getMetricByRoute(metric);
  if (!metricConfig) {
    notFound();
  }

  const IconComponent = iconMap[metricConfig.iconName];
  if (!IconComponent) {
    notFound();
  }

  // Special handling for advanced dashboards
  if (metric === "leads-analytics") {
    return <LeadsAnalyticsDashboard config={metricConfig} />;
  }

  if (metric === "sales-performance") {
    return <SalesPerformanceDashboard config={metricConfig} />;
  }

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Reportes
          </Link>
        </Button>
      </div>

      {/* Metric Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-3 rounded-xl transition-colors duration-300",
              metricConfig.colorTheme === "blue" &&
                "bg-blue-100 dark:bg-blue-900/30",
              metricConfig.colorTheme === "green" &&
                "bg-green-100 dark:bg-green-900/30",
              metricConfig.colorTheme === "purple" &&
                "bg-purple-100 dark:bg-purple-900/30",
              metricConfig.colorTheme === "orange" &&
                "bg-orange-100 dark:bg-orange-900/30"
            )}
          >
            <IconComponent
              className={cn(
                "h-8 w-8 transition-colors duration-300",
                metricConfig.colorTheme === "blue" &&
                  "text-blue-600 dark:text-blue-400",
                metricConfig.colorTheme === "green" &&
                  "text-green-600 dark:text-green-400",
                metricConfig.colorTheme === "purple" &&
                  "text-purple-600 dark:text-purple-400",
                metricConfig.colorTheme === "orange" &&
                  "text-orange-600 dark:text-orange-400"
              )}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {metricConfig.title}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {metricConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Content */}
      <Card className="relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-5",
            metricConfig.gradientFrom,
            metricConfig.gradientTo
          )}
        />

        <div className="relative z-10">
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 p-3 rounded-full bg-muted">
              <IconComponent className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{metricConfig.title}</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              {metricConfig.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-12">
            <div className="text-center">
              <Button asChild>
                <Link href="/reports">Explorar Otras Métricas</Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gráficos Interactivos</CardTitle>
            <CardDescription>
              Visualizaciones dinámicas con filtros personalizables
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exportar Datos</CardTitle>
            <CardDescription>
              Descarga reportes en Excel y otros formatos
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Temporal</CardTitle>
            <CardDescription>
              Comparativas históricas y tendencias de rendimiento
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default async function MetricPage({ params }: MetricPageProps) {
  const { metric } = await params;

  return (
    <Suspense fallback={<MetricPageSkeleton />}>
      <MetricContent metric={metric} />
    </Suspense>
  );
}

// Generate static params for all valid metrics
export async function generateStaticParams() {
  const validMetricIds = getValidMetricIds();

  return validMetricIds.map((metric) => ({
    metric,
  }));
}
