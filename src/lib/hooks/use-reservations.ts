import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Reservation {
  id: string;
  leadId: string;
  quotationId?: string;
  amount: number;
  paymentMethod: string;
  deliveryDate: string;
  reservationFormUrl?: string;
  depositReceiptUrl?: string;
  reservationContractUrl?: string;
  vehicleDetails?: string;
  additionalNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateReservationPayload {
  leadId: string;
  quotationId?: string;
  amount: number;
  paymentMethod: string;
  deliveryDate: Date;
  reservationFormUrl?: string;
  depositReceiptUrl?: string;
  reservationContractUrl?: string;
  vehicleDetails?: string;
  additionalNotes?: string;
}

// Obtener reserva por id de lead
export function useLeadReservation(leadId: string) {
  return useQuery<Reservation | null>({
    queryKey: ["reservation", leadId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/reservation`);

        if (response.status === 404) {
          // No reservation exists
          return null;
        }

        if (!response.ok) {
          throw new Error("Error al obtener reserva");
        }

        return response.json();
      } catch (error) {
        console.error("Error en useLeadReservation:", error);
        throw error;
      }
    },
    enabled: !!leadId,
  });
}

// Crear nueva reserva
export function useCreateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReservationPayload) => {
      const response = await fetch(`/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear reserva"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["reservation", variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
    },
  });
}
