import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LeadWithRelations,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadsResponse,
  Document,
} from "@/types/lead";

interface LeadsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  source?: string;
  assignedTo?: string;
  assignedToId?: string;
  countryId?: string;
  isArchived?: boolean;
  isClosed?: boolean;
  includeArchived?: boolean;
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
  if (filters.countryId) queryParams.append("countryId", filters.countryId);
  if (filters.isArchived !== undefined)
    queryParams.append("isArchived", filters.isArchived.toString());
  if (filters.isClosed !== undefined)
    queryParams.append("isClosed", filters.isClosed.toString());
  if (filters.includeArchived !== undefined)
    queryParams.append("includeArchived", filters.includeArchived.toString());

  return useQuery<LeadsResponse>({
    queryKey: ["leads", filters],
    queryFn: async () => {
      const response = await fetch(`/api/leads?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Error fetching leads");
      }
      return response.json();
    },
    enabled: !(
      filters.assignedToId === undefined && filters.countryId === undefined
    ),
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

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // Si la respuesta no es JSON válida
        console.error(
          "[useUpdateLeadMutation] Error al parsear respuesta JSON:",
          jsonError
        );
      }

      if (!response.ok) {
        // Log completo para depuración
        console.error("[useUpdateLeadMutation] Error response:", responseData);
        throw new Error(
          (responseData && (responseData.error || responseData.message)) ||
            `Error actualizando lead (status ${response.status})`
        );
      }

      return responseData;
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

// Hook para obtener documentos de un lead
export const useLeadDocuments = (leadId?: string) => {
  return useQuery<Document[]>({
    queryKey: ["leadDocuments", leadId],
    queryFn: async () => {
      const response = await fetch(`/api/documents?leadId=${leadId}`);
      if (!response.ok) {
        throw new Error("Error al obtener documentos del lead");
      }
      return response.json();
    },
    enabled: !!leadId,
  });
};

// Hook para subir documentos de un lead
export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      name: string;
      type: string;
      size: number;
      url: string;
    }) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al subir documento"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadDocuments", variables.leadId],
      });
    },
  });
};

// Buscar leads por celular duplicado
export const useCheckDuplicateCellphone = (cellphone: string) => {
  return useQuery<LeadWithRelations[]>({
    queryKey: ["checkDuplicateCellphone", cellphone],
    queryFn: async () => {
      if (!cellphone || cellphone.length < 5) return [];

      const response = await fetch(
        `/api/leads/check-duplicate?cellphone=${encodeURIComponent(cellphone)}`
      );
      if (!response.ok) {
        throw new Error("Error checking duplicate cellphone");
      }
      return response.json();
    },
    enabled: !!cellphone && cellphone.length >= 5,
  });
};

// Exportar leads
export const useExportLeadsMutation = () => {
  return useMutation({
    mutationFn: async (filters: LeadsFilter & { format: "csv" | "excel" }) => {
      const queryParams = new URLSearchParams();

      // Agregar filtros a los parámetros de consulta
      if (filters.page) queryParams.append("page", filters.page.toString());
      if (filters.pageSize)
        queryParams.append("pageSize", filters.pageSize.toString());
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.source) queryParams.append("source", filters.source);
      if (filters.assignedTo)
        queryParams.append("assignedTo", filters.assignedTo);
      if (filters.assignedToId)
        queryParams.append("assignedToId", filters.assignedToId);
      if (filters.countryId) queryParams.append("countryId", filters.countryId);
      if (filters.isArchived !== undefined)
        queryParams.append("isArchived", filters.isArchived.toString());
      if (filters.isClosed !== undefined)
        queryParams.append("isClosed", filters.isClosed.toString());
      if (filters.includeArchived !== undefined)
        queryParams.append(
          "includeArchived",
          filters.includeArchived.toString()
        );

      queryParams.append("format", filters.format);

      const response = await fetch(
        `/api/leads/export?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error exporting leads");
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split("T")[0]}.${filters.format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
};
