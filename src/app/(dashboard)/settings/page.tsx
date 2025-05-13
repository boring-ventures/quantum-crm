"use client";

import { SettingsForm } from "./components/settings-form";
import { PasswordForm } from "./components/password-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Separator } from "@/components/ui/separator";

// Forzar renderizado dinámico para evitar errores con cookies()
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { profile, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingScreen message="Cargando configuración..." />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground">
            No se pudo cargar tu perfil. Por favor, intenta de nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <SettingsForm />
      </div>

      <Separator />

      <div>
        <PasswordForm />
      </div>
    </div>
  );
}
