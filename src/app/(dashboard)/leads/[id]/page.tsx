"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { LeadDetailPage } from "@/components/leads/lead-detail-page";
import { useLeadQuery } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/utils/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useUserStore } from "@/store/userStore";

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Obtener el usuario actual desde el store
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  // Verificar permisos para ver leads
  const canViewLeads = hasPermission(currentUser, "leads", "view");

  if (!id) {
    router.push("/leads");
    return null;
  }

  // Si no tiene permiso para ver leads, mostrar acceso denegado
  if (!canViewLeads && !isLoadingCurrentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <Alert className="max-w-md">
          <Info className="h-5 w-5" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a la información de leads.
          </AlertDescription>
        </Alert>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const { data: lead, isLoading, isError } = useLeadQuery(id);

  console.log(" useLeadQuery: lead: ", id);

  const handleBack = () => {
    router.push("/leads");
  };

  if (isLoading || isLoadingCurrentUser) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-md" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Error al cargar el lead
        </h2>
        <p className="text-gray-500 mb-4">
          No se pudo cargar la información del lead.
        </p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver a leads
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <LeadDetailPage
        lead={lead}
        onBack={handleBack}
        currentUser={currentUser}
      />
    </div>
  );
}
