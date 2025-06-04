"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  Plus,
  ClipboardList,
  Clock,
  X,
  Loader2,
  Calendar,
  CheckCircle,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/lead";
import { TaskTypeDialog } from "@/components/leads/task-type-dialog";
import {
  useLeadTasks,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { hasPermission } from "@/lib/utils/permissions";
import { TaskQuickViewModal } from "@/app/(dashboard)/tasks/components/task-quick-view-modal";

interface TaskListProps {
  leadId: string;
  currentUser?: any;
}

interface TaskListItemProps {
  task: Task;
  onUpdate: () => void;
  isSeller?: boolean;
  currentUser?: any;
}

function TaskListItem({
  task,
  onUpdate,
  isSeller = false,
  currentUser,
}: TaskListItemProps) {
  const { toast } = useToast();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const handleComplete = async () => {
    if (!isSeller) return;

    setIsUpdating(true);
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
        status: "COMPLETED",
      });

      toast({
        title: "Tarea completada",
        description: "La tarea ha sido marcada como completada",
      });

      onUpdate();
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!isSeller) return;

    try {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
      });

      setShowDeleteDialog(false);
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente",
      });

      onUpdate();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div
        className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-gray-700 py-4 gap-3"
        onClick={() => setShowTaskModal(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="flex-1">
          <h5
            className={`text-lg font-medium ${
              task.status === "COMPLETED" || task.status === "CANCELLED"
                ? "text-gray-600 dark:text-gray-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {task.title}
          </h5>
          <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            {format(new Date(task.createdAt), "d 'de' MMMM, yyyy", {
              locale: es,
            })}
          </div>
          {task.scheduledFor && (
            <div className="flex items-center mt-1 text-sm text-blue-500 dark:text-blue-400">
              <Calendar className="h-4 w-4 mr-1" />
              {format(
                new Date(task.scheduledFor),
                "d 'de' MMMM, yyyy • HH:mm",
                {
                  locale: es,
                }
              )}
            </div>
          )}
          {task.description && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
              {task.description}
            </div>
          )}
        </div>

        {isSeller ? (
          <div className="flex gap-2 justify-end">
            {task.status === "PENDING" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-500 dark:border-green-800/30 dark:hover:bg-green-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete();
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">Completar</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div>
            <Badge
              variant={task.status === "COMPLETED" ? "success" : "outline"}
              className={
                task.status === "COMPLETED"
                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50"
                  : ""
              }
            >
              {task.status === "COMPLETED" ? "Completada" : "Pendiente"}
            </Badge>
          </div>
        )}

        {isSeller && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar tarea</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿Estás seguro de que quieres eliminar esta tarea? Esta acción
                  no se puede deshacer.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <TaskQuickViewModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        task={task}
        onDelete={onUpdate}
        onUpdate={onUpdate}
        currentUser={currentUser}
      />
    </>
  );
}

export function TaskList({ leadId, currentUser }: TaskListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: tasks, isLoading, refetch } = useLeadTasks(leadId);
  const { toast } = useToast();

  const canCreateTasks = hasPermission(currentUser, "tasks", "create");
  const canUpdateTasks = hasPermission(currentUser, "tasks", "edit");

  // Agrupar tareas por estatus
  const groupedTasks =
    tasks?.reduce(
      (groups, task) => {
        const group = groups[task.status] || [];
        group.push(task);
        groups[task.status] = group;
        return groups;
      },
      {} as Record<string, Task[]>
    ) || {};

  // Ordenar las tareas por fecha de creación (más recientes primero)
  const sortedTasks = Object.keys(groupedTasks).reduce(
    (sorted, status) => {
      sorted[status] = [...groupedTasks[status]].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sorted;
    },
    {} as Record<string, Task[]>
  );

  // Definir el orden de los grupos
  const statusOrder = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  const NoTasksPlaceholder = () => (
    <div className="text-center py-10 space-y-4">
      <div className="flex justify-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full">
          <ClipboardList className="h-10 w-10 text-blue-500" />
        </div>
      </div>
      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
        No hay tareas todavía
      </h4>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Crea tu primera tarea para este lead. Las tareas te ayudan a organizar y
        dar seguimiento a tus actividades de ventas.
      </p>
      {canCreateTasks && (
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear primera tarea
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Tareas
        </h3>
        {canCreateTasks && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva tarea
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <NoTasksPlaceholder />
      ) : (
        <div className="space-y-6">
          {statusOrder.map(
            (status) =>
              sortedTasks[status]?.length > 0 && (
                <div key={status} className="space-y-3">
                  {status === "PENDING" && (
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Pendientes
                    </h4>
                  )}
                  {status === "IN_PROGRESS" && (
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                      En progreso
                    </h4>
                  )}
                  {status === "COMPLETED" && (
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mt-6">
                      Completadas
                    </h4>
                  )}
                  {status === "CANCELLED" && (
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mt-6">
                      Canceladas
                    </h4>
                  )}
                  {sortedTasks[status].map((task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      onUpdate={refetch}
                      isSeller={canUpdateTasks}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )
          )}
        </div>
      )}

      {canCreateTasks && (
        <TaskTypeDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          leadId={leadId}
        />
      )}
    </div>
  );
}
