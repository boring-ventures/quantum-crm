"use client";

import { useRouter } from "next/navigation";
import { LeadDetailPage } from "@/components/leads/lead-detail-page";
import { useLeadQuery } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadInterceptPageProps {
  params: {
    id: string;
  };
}

export default function LeadInterceptPage({ params }: LeadInterceptPageProps) {
  const router = useRouter();
  const { data: lead, isLoading, isError } = useLeadQuery(params.id);

  const handleBack = () => {
    router.push("/leads");
  };

  // Si está cargando, mostrar un esqueleto
  if (isLoading) {
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

  // Si hay un error, mostrar un mensaje
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
      <LeadDetailPage lead={lead} onBack={handleBack} />
    </div>
  );
}
