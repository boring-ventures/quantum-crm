import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types/lead";
import { leadsCircuitBreaker, apiBackoff } from "@/lib/utils/circuit-breaker";
import { useAuthErrorHandler } from "@/hooks/use-auth-error-handler";

// Obtener todas las tareas con filtros opcionales
export const useTasks = ({
  assignedToId,
  countryId,
  showAllTasks = false,
}: {
  assignedToId?: string;
  countryId?: string;
  showAllTasks?: boolean;
} = {}) => {
  const { handleAuthError } = useAuthErrorHandler();

  return useQuery<Task[]>({
    queryKey: ["tasks", assignedToId, countryId, showAllTasks],
    queryFn: async () => {
      return await leadsCircuitBreaker.call(async () => {
        return await apiBackoff.execute(async () => {
          // Determinar qué endpoint usar
          let url = showAllTasks ? "/api/tasks/all" : "/api/tasks/user";
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

          console.log("[useTasks] Llamando a:", url);
          console.log("[useTasks] Parámetros:", {
            assignedToId,
            countryId,
            showAllTasks,
          });

          const response = await fetch(url);

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("AUTH_INVALID: Session may be expired");
            }
            if (response.status === 403) {
              throw new Error("AUTH_FORBIDDEN: Insufficient permissions for tasks");
            }
            throw new Error(`Error al cargar tareas: ${response.status} ${response.statusText}`);
          }

          const tasks = await response.json();
          console.log("[useTasks] Tareas obtenidas:", tasks.length);

          return tasks;
        }, `fetch-tasks-${assignedToId || 'all'}`);
      });
    },
    retry: (failureCount, error) => {
      // Intentar manejar el error de autenticación (sin forzar modal inmediatamente)
      const handled = handleAuthError(error, failureCount >= 2); // Solo mostrar modal en el 3er intento

      // No reintentar si es un error de autenticación
      if (handled) {
        return false;
      }

      // Máximo 2 reintentos para otros errores
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
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

// Actualizar las notas de finalización de una tarea
export const useUpdateTaskCompletionNotesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      leadId,
      completionNotes,
    }: {
      taskId: string;
      leadId: string;
      completionNotes: string;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/completion-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Error al actualizar notas de finalización"
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
