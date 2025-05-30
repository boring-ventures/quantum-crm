"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { auth } from "@/lib/auth";
import Link from "next/link";

// Componente estático para errores de autenticación - sin redirecciones
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, fetchUser, isLoading } = useUserStore();

  useEffect(() => {
    if (!user && !isLoading) {
      fetchUser();
    }
  }, []);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!user?.roleId) {
    return <AuthError />;
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
