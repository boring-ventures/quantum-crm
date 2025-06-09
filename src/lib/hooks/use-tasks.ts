import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types/lead";

// Obtener todas las tareas con filtros opcionales
export const useTasks = ({
  assignedToId,
  countryId,
}: {
  assignedToId?: string;
  countryId?: string;
} = {}) => {
  return useQuery<Task[]>({
    queryKey: ["tasks", assignedToId, countryId],
    queryFn: async () => {
      try {
        let url = "/api/tasks/user";
        const params = new URLSearchParams();

        // Si se proporciona assignedToId, agregar como parámetro
        if (assignedToId) {
          params.append("assignedToId", assignedToId);
        }

        // Si se proporciona countryId, agregar como parámetro
        if (countryId) {
          params.append("countryId", countryId);
        }

        // Agregar parámetros a la URL si existen
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Error al cargar tareas");
        }

        return response.json();
      } catch (error) {
        console.error("Error cargando tareas:", error);
        return [];
      }
    },
  });
};

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
        console.error("Error fetching lead tasks:", error);
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
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
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
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
};

// Eliminar una tarea
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; leadId: string }) => {
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
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
};

// Obtener tareas de test drive del equipo para el calendario
export const useTeamTestDriveTasks = (startDate?: Date, endDate?: Date) => {
  const queryParams = new URLSearchParams();

  if (startDate) {
    queryParams.append("startDate", startDate.toISOString());
  }
  if (endDate) {
    queryParams.append("endDate", endDate.toISOString());
  }

  // Filtrar solo tareas de test drive y visitas al salon
  queryParams.append("taskTypes", "test-drive,client-visit");
  queryParams.append("status", "PENDING,IN_PROGRESS");

  return useQuery<Task[]>({
    queryKey: ["teamTestDriveTasks", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/tasks/team-calendar?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error fetching team test drive tasks");
      }
      return response.json();
    },
  });
};
