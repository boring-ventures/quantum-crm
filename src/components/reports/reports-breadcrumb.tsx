"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getMetricByRoute } from "@/lib/reports/config";
import { BarChart3, Home, TrendingUp, DollarSign, Users } from "lucide-react";
import { LucideIcon } from "lucide-react";

// Icon mapping for client-side rendering
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
};

export function ReportsBreadcrumb() {
  const pathname = usePathname();

  // Parse the current route
  const isReportsHome = pathname === "/reports";
  const metricRoute = pathname.replace("/reports/", "");
  const currentMetric = isReportsHome ? null : getMetricByRoute(metricRoute);

  // Get the icon component if metric exists
  const MetricIconComponent = currentMetric
    ? iconMap[currentMetric.iconName]
    : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {isReportsHome ? (
          <BreadcrumbPage className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </BreadcrumbPage>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reportes
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbPage className="flex items-center gap-2">
              {currentMetric && MetricIconComponent && (
                <>
                  <MetricIconComponent className="h-4 w-4" />
                  {currentMetric.title}
                </>
              )}
            </BreadcrumbPage>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
