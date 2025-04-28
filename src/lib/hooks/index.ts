// Exportar todos los hooks para facilitar su importación
export * from "./use-leads";
export * from "./use-companies";
export * from "./use-products";
export * from "./use-lead-metadata";
export * from "./use-quotations";

// Exportar los hooks de tareas explícitamente
import {
  useLeadTasks,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from "./use-tasks";

export {
  useLeadTasks,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
};
