import { useQuery } from "@tanstack/react-query";
import type { LeadStatus, LeadSource } from "@/types/lead";

// Hook para obtener estados de leads
export const useLeadStatuses = () => {
  return useQuery<LeadStatus[]>({
    queryKey: ["leadStatuses"],
    queryFn: async () => {
      const response = await fetch("/api/lead-statuses");
      if (!response.ok) {
        throw new Error("Error al obtener estados de leads");
      }
      return response.json();
    },
  });
};

// Hook para obtener fuentes de leads
export const useLeadSources = () => {
  return useQuery<LeadSource[]>({
    queryKey: ["leadSources"],
    queryFn: async () => {
      const response = await fetch("/api/lead-sources");
      if (!response.ok) {
        throw new Error("Error al obtener fuentes de leads");
      }
      return response.json();
    },
  });
};
