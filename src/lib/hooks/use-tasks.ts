import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types/lead";

// Obtener las tareas de un lead
export const useLeadTasks = (leadId: string) => {
  return useQuery<Task[]>({
    queryKey: ["leadTasks", leadId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/tasks`);
        // Si es 404, simplemente devolver un array vacío en lugar de error
        if (response.status === 404) {
          return [];
        }

        if (!response.ok) {
          throw new Error("Error fetching lead tasks");
        }

        return response.json();
      } catch (error) {
        // Si el endpoint no existe, retornar array vacío
        return [];
      }
    },
    enabled: !!leadId,
  });
};

// Crear una nueva tarea para un lead
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      title: string;
      assignedToId: string;
      description?: string;
      scheduledFor?: Date;
    }) => {
      const response = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          assignedToId: data.assignedToId,
          leadId: data.leadId,
          status: "PENDING",
          description: data.description,
          scheduledFor: data.scheduledFor
            ? data.scheduledFor.toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al crear tarea"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadTasks", variables.leadId],
      });
    },
  });
};

// Actualizar el estado de una tarea
export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      leadId,
      status,
    }: {
      taskId: string;
      leadId: string;
      status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al actualizar tarea"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadTasks", variables.leadId],
      });
    },
  });
};

// Eliminar una tarea
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      leadId,
    }: {
      taskId: string;
      leadId: string;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al eliminar tarea"
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadTasks", variables.leadId],
      });
    },
  });
};
