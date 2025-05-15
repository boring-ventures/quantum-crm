"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task } from "@/types/lead";
import {
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  User,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/lib/hooks";

interface TaskQuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function TaskQuickViewModal({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onUpdate,
}: TaskQuickViewModalProps) {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const deleteTaskMutation = useDeleteTaskMutation();
  const updateTaskMutation = useUpdateTaskStatusMutation();
  const { toast } = useToast();

  // Obtener texto y color de prioridad (para cuando implementemos prioridad)
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
            Alta
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
            Media
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
            Baja
          </Badge>
        );
      default:
        return null;
    }
  };

  // Obtener texto y estilo del estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pendiente
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
            En progreso
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
            Completado
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  // Marcar tarea como completada
  const markAsCompleted = async () => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
        status: "COMPLETED",
      });

      toast({
        title: "Tarea completada",
        description: "La tarea se ha marcado como completada",
      });

      if (onUpdate) onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al completar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive",
      });
    }
  };

  // Eliminar tarea
  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
      });

      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente",
      });

      setIsConfirmDeleteOpen(false);
      onOpenChange(false);

      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(task.status)}
              {/* Aquí iría el badge de prioridad cuando lo implementemos */}
              {/* {getPriorityBadge(task.priority)} */}
            </div>

            {task.description && (
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                {task.description}
              </div>
            )}

            <div className="space-y-3">
              {task.scheduledFor && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Programada para:{" "}
                    {format(new Date(task.scheduledFor), "PPP 'a las' HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  Lead asociado:{" "}
                  <a
                    href={`/leads/${task.leadId}`}
                    className="text-blue-600 hover:underline"
                  >
                    Ver lead
                  </a>
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {task.status !== "COMPLETED" && (
              <Button
                variant="outline"
                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                onClick={markAsCompleted}
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar
              </Button>
            )}

            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>

            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setIsConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la tarea y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
