import { Suspense } from "react";
import { MetricCard } from "@/components/reports/metric-card";
import { REPORTS_METRICS } from "@/lib/reports/config";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

// Loading skeleton for metric cards
function MetricCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

// Grid of metric cards
function MetricsGrid() {
  const metrics = Object.values(REPORTS_METRICS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Suspense key={metric.id} fallback={<MetricCardSkeleton />}>
          <MetricCard metric={metric} />
        </Suspense>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reportes y Análisis
            </h1>
            <p className="text-muted-foreground">
              Métricas y análisis detallados del rendimiento de tu CRM
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        <MetricsGrid />
      </Suspense>

      {/* Additional Info */}
      <div className="mt-12 p-6 rounded-lg border bg-muted/50">
        <h2 className="text-lg font-semibold mb-2">
          ¿Necesitas ayuda con los reportes?
        </h2>
        <p className="text-sm text-muted-foreground">
          Cada sección de reportes proporciona análisis detallados y
          visualizaciones interactivas para ayudarte a tomar decisiones
          informadas sobre tu negocio.
        </p>
      </div>
    </div>
  );
}
