"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  CalendarIcon,
  Trash2,
  Edit,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import { Task, LeadWithRelations } from "@/types/lead";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/lib/hooks/use-tasks";
import { toast } from "@/components/ui/use-toast";

// Extender el tipo Task para incluir las relaciones que esperamos
interface TaskWithRelations extends Task {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
}

interface TaskQuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithRelations;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  isManagerRole?: boolean;
}

export function TaskQuickViewModal({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onUpdate,
  isManagerRole = false,
}: TaskQuickViewModalProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isStatusChangeLoading, setIsStatusChangeLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "IN_PROGRESS":
        return "En progreso";
      case "COMPLETED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      default:
        return status;
    }
  };

  const formatScheduledDate = (date: string | Date | null) => {
    if (!date) return "No programada";
    return format(new Date(date), "PPP 'a las' p", { locale: es });
  };

  const handleCompleteTask = async () => {
    if (isManagerRole) {
      toast({
        title: "Acción no permitida",
        description:
          "Los administradores no pueden cambiar el estado de las tareas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStatusChangeLoading(true);
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
        status: "COMPLETED",
      });
      onUpdate();
      onOpenChange(false);
      toast({
        title: "Tarea completada",
        description: "La tarea ha sido marcada como completada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsStatusChangeLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (isManagerRole) {
      toast({
        title: "Acción no permitida",
        description:
          "Los administradores no pueden cambiar el estado de las tareas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStatusChangeLoading(true);
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
        status: "CANCELLED",
      });
      onUpdate();
      onOpenChange(false);
      toast({
        title: "Tarea cancelada",
        description: "La tarea ha sido cancelada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsStatusChangeLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsDeleteLoading(true);
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
      });
      setIsDeleteAlertOpen(false);
      onOpenChange(false);
      onDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Determinar si el botón debe estar deshabilitado
  const isStatusButtonDisabled = (status: string) => {
    return (
      isManagerRole || // Si es administrador
      isStatusChangeLoading || // Si hay una operación en curso
      task.status === status || // Si ya tiene ese estado
      task.status === "COMPLETED" || // Si ya está completada
      task.status === "CANCELLED" // Si ya está cancelada
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className={`${getStatusColor(task.status)} px-2 py-0.5`}
              >
                {getStatusText(task.status)}
              </Badge>

              {task.scheduledFor && (
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <span className="text-xs">
                    {formatScheduledDate(task.scheduledFor)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del lead */}
            {task.lead && (
              <div>
                <h3 className="text-sm font-medium mb-1">Lead asociado:</h3>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-500" />
                  <span>
                    {task.lead.firstName} {task.lead.lastName}
                  </span>
                </div>
              </div>
            )}

            {/* Información del vendedor asignado */}
            {task.assignedTo && (
              <div>
                <h3 className="text-sm font-medium mb-1">Asignado a:</h3>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-green-500" />
                  <span>{task.assignedTo.name}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Descripción de la tarea */}
            <div>
              <h3 className="text-sm font-medium mb-1">Descripción:</h3>
              <p className="text-sm">{task.description || "Sin descripción"}</p>
            </div>

            {/* Datos de tiempo */}
            <div>
              <div className="flex items-start gap-6 text-xs text-muted-foreground">
                <div>
                  <h4 className="font-medium mb-1">Creada</h4>
                  <p>
                    {task.createdAt
                      ? format(new Date(task.createdAt), "Pp", { locale: es })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Actualizada</h4>
                  <p>
                    {task.updatedAt
                      ? format(new Date(task.updatedAt), "Pp", { locale: es })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {task.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleCancelTask}
                    disabled={isStatusButtonDisabled("CANCELLED")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCompleteTask}
                    disabled={isStatusButtonDisabled("COMPLETED")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Completar
                  </Button>
                </>
              )}
              {isStatusButtonDisabled("COMPLETED") &&
                isManagerRole &&
                task.status === "PENDING" && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                    Solo el vendedor puede cambiar el estado
                  </div>
                )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTask();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
