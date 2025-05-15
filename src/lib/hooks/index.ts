// Exportar todos los hooks para facilitar su importación
export * from "./use-leads";
export * from "./use-companies";
export * from "./use-products";
export * from "./use-lead-metadata";
export * from "./use-quotations";
export * from "./use-reservations";
export * from "./use-sales";
export * from "./use-permissions";
export * from "./use-roles";
export * from "./use-user-role";

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
