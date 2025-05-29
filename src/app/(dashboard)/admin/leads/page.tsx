"use client";

import { Settings2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";

// Opciones de configuración para leads
const LEAD_CONFIG_OPTIONS = [
  {
    title: "Estados de Lead",
    description:
      "Configura los estados por los que pasa un lead en el proceso de venta",
    href: "/admin/leads/statuses",
  },
  {
    title: "Categorías de Fuente",
    description:
      "Agrupa las fuentes de leads como Sitio Web, Publicidad Digital, Evento, etc.",
    href: "/admin/leads/source-categories",
  },
  {
    title: "Fuentes de Lead",
    description:
      "Gestiona las fuentes específicas como Facebook, Instagram, Google Ads",
    href: "/admin/leads/sources",
  },
  // {
  //   title: "Motivos de Cierre",
  //   description: "Gestiona los motivos de cierre para tus leads",
  //   href: "/admin/leads/closure-reasons",
  // },
];

export default function LeadsConfigPage() {
  const { user: currentUser } = useUserStore();

  // Permisos generales
  const canViewLeadConfig = hasPermission(
    currentUser,
    "leads-settings",
    "view"
  );

  // Validar acceso a la página
  if (!canViewLeadConfig) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Configuración de Leads</h1>
        <p className="text-muted-foreground">
          Administra los parámetros de configuración para la gestión de leads
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 md:grid-cols-1 lg:grid-cols-1">
        {LEAD_CONFIG_OPTIONS.map((option) => (
          <Card key={option.href} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">
                {option.title}
              </CardTitle>
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 text-sm">
                {option.description}
              </CardDescription>
              <Link href={option.href} passHref>
                <Button variant="default" className="w-full">
                  Configurar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
