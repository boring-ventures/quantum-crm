"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { LeadDetailPage } from "@/components/leads/lead-detail-page";
import { useLeadQuery } from "@/lib/hooks";
import { useUserRole } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();
  const { isSeller } = useUserRole();

  const { id } = use(params);

  if (!id) {
    router.push("/leads");
    return null;
  }

  const { data: lead, isLoading, isError } = useLeadQuery(id);

  const handleBack = () => {
    router.push("/leads");
  };

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
      <LeadDetailPage lead={lead} onBack={handleBack} isSeller={isSeller} />
    </div>
  );
}
