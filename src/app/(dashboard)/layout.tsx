import { Suspense } from "react";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { AuthProvider } from "@/components/auth/auth-provider";

// Loading fallback minimalista
function LoadingFallback() {
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <DashboardLayoutClient>{children}</DashboardLayoutClient>
      </AuthProvider>
    </Suspense>
  );
}
