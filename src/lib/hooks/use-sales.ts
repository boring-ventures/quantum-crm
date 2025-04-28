import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Sale {
  id: string;
  leadId: string;
  reservationId?: string;
  amount: number;
  paymentMethod: string;
  saleContractUrl?: string;
  additionalNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateSalePayload {
  leadId: string;
  reservationId?: string;
  amount: number;
  paymentMethod: string;
  saleContractUrl?: string;
  additionalNotes?: string;
}

// Obtener venta por id de lead
export function useLeadSale(leadId: string) {
  return useQuery<Sale | null>({
    queryKey: ["sale", leadId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/sale`);

        if (response.status === 404) {
          // No sale exists
          return null;
        }

        if (!response.ok) {
          throw new Error("Error al obtener venta");
        }

        return response.json();
      } catch (error) {
        console.error("Error en useLeadSale:", error);
        throw error;
      }
    },
    enabled: !!leadId,
  });
}

// Crear nueva venta
export function useCreateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalePayload) => {
      const response = await fetch(`/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear venta"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["sale", variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
    },
  });
}
