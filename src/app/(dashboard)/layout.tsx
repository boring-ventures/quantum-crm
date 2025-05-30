import { Suspense } from "react";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { AuthProvider } from "@/components/auth/auth-provider";
import Link from "next/link";

// Componente estático para errores de autenticación
function AuthError() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
        <div className="text-xl font-medium text-black mb-2">
          Error de autenticación
        </div>
        <p className="text-gray-500 mb-4">
          Ha ocurrido un error con tu sesión. Por favor, intenta iniciar sesión
          nuevamente.
        </p>
        <Link
          href="/sign-in"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

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
