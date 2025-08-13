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
import { CheckCircle2, Clock, CalendarIcon, Trash2, User } from "lucide-react";
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
import { hasPermission, getScope } from "@/lib/utils/permissions";

// Extender el tipo Task para incluir las relaciones que esperamos
interface TaskWithRelations extends Task {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    cellphone?: string;
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
  onDelete: () => void;
  onUpdate: () => void;
  currentUser?: any;
}

export function TaskQuickViewModal({
  open,
  onOpenChange,
  task,
  onDelete,
  onUpdate,
  currentUser,
}: TaskQuickViewModalProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isStatusChangeLoading, setIsStatusChangeLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Verificar permisos
  const canEditTasks = hasPermission(currentUser, "tasks", "edit");
  const canDeleteTasks = hasPermission(currentUser, "tasks", "delete");

  // Obtener el scope de permisos
  const taskScope = getScope(currentUser, "tasks", "edit");

  // Verificar si el usuario puede modificar esta tarea específica según su scope
  const canModifyThisTask = () => {
    if (!canEditTasks) return false;

    // Si no hay usuario actual o tarea, no se puede modificar
    if (!currentUser || !task) return false;

    // Si scope es 'all', puede modificar cualquier tarea
    if (taskScope === "all") return true;

    // Si scope es 'self', solo puede modificar tareas asignadas a él
    if (taskScope === "self") {
      return task.assignedToId === currentUser.id;
    }

    // Si scope es 'team', puede modificar tareas de su mismo país
    if (taskScope === "team" && task.assignedTo && currentUser.countryId) {
      // Aquí necesitaríamos el país del usuario asignado a la tarea
      // Como no tenemos el país en el objeto task.assignedTo, asumimos que solo
      // se puede modificar si está asignada al usuario actual
      return task.assignedToId === currentUser.id;
    }

    return false;
  };

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
    if (!canModifyThisTask()) {
      toast({
        title: "Acción no permitida",
        description: "No tienes permiso para modificar esta tarea",
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

  const handleDeleteTask = async () => {
    if (!canDeleteTasks) {
      toast({
        title: "Acción no permitida",
        description: "No tienes permiso para eliminar tareas",
        variant: "destructive",
      });
      return;
    }

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

  // Verificar si la tarea se puede completar
  const canCompleteTask = () => {
    return (
      canModifyThisTask() && task.status === "PENDING" && !isStatusChangeLoading
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            {/* Reemplazar DialogDescription con div para evitar problema de anidación */}
            <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
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
            </div>
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
                <div className="mt-1 text-xs text-muted-foreground">
                  {task.lead.cellphone
                    ? `Cel: ${task.lead.cellphone}`
                    : "Sin celular"}
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`/leads/${task.lead?.id}`, "_blank")
                    }
                  >
                    Ver detalle del Lead
                  </Button>
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

          <DialogFooter className="flex justify-end">
            {task.status === "PENDING" && canCompleteTask() && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCompleteTask}
                disabled={isStatusChangeLoading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completar
              </Button>
            )}

            {canDeleteTasks && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
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
