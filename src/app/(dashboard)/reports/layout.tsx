import { ReportsBreadcrumb } from "@/components/reports/reports-breadcrumb";
import { Separator } from "@/components/ui/separator";

interface ReportsLayoutProps {
  children: React.ReactNode;
}

export default function ReportsLayout({ children }: ReportsLayoutProps) {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="space-y-4">
        <ReportsBreadcrumb />
        <Separator />
      </div>

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
