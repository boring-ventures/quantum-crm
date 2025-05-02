"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <ShieldAlert className="h-24 w-24 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground text-lg">
          No tienes permisos para acceder a esta sección. Contacta al
          administrador si consideras que deberías tener acceso.
        </p>
        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
