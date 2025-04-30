import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Quotation {
  id: string;
  leadId: string;
  totalAmount: number;
  proformaUrl?: string;
  additionalNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateQuotationPayload {
  leadId: string;
  totalAmount: number;
  proformaUrl?: string;
  additionalNotes?: string;
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

// Obtener cotización por id de lead
export function useLeadQuotation(leadId: string) {
  return useQuery<Quotation | null>({
    queryKey: ["quotation", leadId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/quotation`);

        if (response.status === 404) {
          // No quotation exists
          return null;
        }

        if (!response.ok) {
          throw new Error("Error fetching quotation");
        }

        return response.json();
      } catch (error) {
        console.error("Error in useLeadQuotation:", error);
        throw error;
      }
    },
    enabled: !!leadId,
  });
}

// Crear nueva cotización
export function useCreateQuotationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuotationPayload) => {
      const response = await fetch(`/api/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear cotización"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["quotation", variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Crear un documento relacionado a una cotización
export function useCreateDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      name: string;
      type: string;
      size: number;
      url: string;
    }) => {
      const response = await fetch(`/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear documento"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.leadId],
      });
    },
  });
}
