import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LeadWithRelations,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadsResponse,
} from "@/types/lead";

interface LeadsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  source?: string;
  assignedTo?: string;
  assignedToId?: string;
}

// Consulta de leads con filtros
export const useLeadsQuery = (filters: LeadsFilter = {}) => {
  const queryParams = new URLSearchParams();

  // Agregar filtros a los parámetros de consulta
  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.pageSize)
    queryParams.append("pageSize", filters.pageSize.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.source) queryParams.append("source", filters.source);
  if (filters.assignedTo) queryParams.append("assignedTo", filters.assignedTo);
  if (filters.assignedToId)
    queryParams.append("assignedToId", filters.assignedToId);

  return useQuery<LeadsResponse>({
    queryKey: ["leads", filters],
    queryFn: async () => {
      const response = await fetch(`/api/leads?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Error fetching leads");
      }
      return response.json();
    },
  });
};

// Obtener un lead específico
export const useLeadQuery = (id?: string) => {
  return useQuery<LeadWithRelations>({
    queryKey: ["leads", id],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${id}`);
      if (!response.ok) {
        throw new Error("Error fetching lead");
      }
      return response.json();
    },
    enabled: !!id,
  });
};

// Crear nuevo lead
export const useCreateLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeadPayload) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear lead"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

// Actualizar lead existente
export const useUpdateLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLeadPayload;
    }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating lead");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

// Eliminar lead
export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting lead");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

// Obtener las notas de un lead
export const useLeadNotes = (leadId?: string) => {
  return useQuery({
    queryKey: ["leadNotes", leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}/notes`);
      if (!response.ok) {
        throw new Error("Error fetching lead notes");
      }
      return response.json();
    },
    enabled: !!leadId,
  });
};

// Crear una nueva nota para un lead
export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      content: string;
      isPinned?: boolean;
    }) => {
      const response = await fetch(`/api/leads/${data.leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          isPinned: data.isPinned || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear nota"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadNotes", variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
    },
  });
};

// Actualizar el estado de un lead
export const useUpdateLeadStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      statusId,
    }: {
      leadId: string;
      statusId: string;
    }) => {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Error al actualizar estado del lead"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

// Actualizar el estado de favorito de un lead
export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      isFavorite,
    }: {
      leadId: string;
      isFavorite: boolean;
    }) => {
      const response = await fetch(`/api/leads/${leadId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFavorite,
          favoriteAt: isFavorite ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Error al actualizar estado de favorito"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
