"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2,
  Calendar,
  CheckCircle,
  User,
  Calendar as CalendarIcon,
  ClipboardList,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Task } from "@/types/lead";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateTaskStatusMutation } from "@/lib/hooks";
import { hasPermission, getScope } from "@/lib/utils/permissions";

interface TaskDetailsDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: any;
  onUpdate?: () => void;
}

export function TaskDetailsDialog({
  taskId,
  open,
  onOpenChange,
  currentUser,
  onUpdate,
}: TaskDetailsDialogProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignee, setAssignee] = useState<{ name: string; id: string } | null>(
    null
  );
  const { toast } = useToast();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const [isUpdating, setIsUpdating] = useState(false);

  // Verificar permisos
  const canEditTasks = hasPermission(currentUser, "tasks", "edit");

  // Obtener el scope de permisos
  const taskScope = getScope(currentUser, "tasks", "edit");

  // Verificar si el usuario puede modificar esta tarea específica según su scope
  const canModifyThisTask = () => {
    if (!canEditTasks || !task) return false;

    // Si no hay usuario actual o tarea, no se puede modificar
    if (!currentUser) return false;

    // Si scope es 'all', puede modificar cualquier tarea
    if (taskScope === "all") return true;

    // Si scope es 'self', solo puede modificar tareas asignadas a él
    if (taskScope === "self") {
      return task.assignedToId === currentUser.id;
    }

    // Si scope es 'team', puede modificar tareas de usuarios de su mismo país
    if (taskScope === "team" && currentUser.countryId) {
      // Aquí necesitaríamos el país del usuario asignado a la tarea
      // Como no tenemos el país en el objeto assignee, asumimos que solo
      // se puede modificar si está asignada al usuario actual
      return task.assignedToId === currentUser.id;
    }

    return false;
  };

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!open || !taskId) return;

      setIsLoading(true);
      try {
        console.log("Cargando tarea:", taskId); // Para depuración
        const response = await fetch(`/api/tasks/${taskId}`);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error en la respuesta:", response.status, errorData);
          throw new Error(
            `Error al cargar los detalles de la tarea: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Datos de tarea recibidos:", data); // Para depuración
        setTask(data);

        // Si la tarea tiene un responsable asignado, obtener su información
        if (data.assignedToId) {
          const userResponse = await fetch(`/api/users/${data.assignedToId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setAssignee({
              id: userData.id,
              name: userData.name,
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar los detalles de la tarea:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la tarea",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, open, toast]);

  const handleCompleteTask = async () => {
    if (!task) return;

    if (!canModifyThisTask()) {
      toast({
        title: "Acción no permitida",
        description: "No tienes permiso para modificar esta tarea",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        leadId: task.leadId,
        status: "COMPLETED",
      });

      // Actualizar la tarea en el estado local
      setTask({
        ...task,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      });

      toast({
        title: "Tarea completada",
        description: "La tarea ha sido marcada como completada",
      });

      // Si existe la función onUpdate, la llamamos
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error al completar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
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

  // Verificar si la tarea se puede completar
  const canCompleteTask = () => {
    return task?.status === "PENDING" && canModifyThisTask() && !isUpdating;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="mt-3 text-gray-500">
              Cargando detalles de la tarea...
            </p>
          </div>
        ) : !task ? (
          <div className="py-6">
            <p className="text-center text-gray-600">
              No se pudo cargar la información de la tarea.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
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
              {/* Información del vendedor asignado */}
              {assignee && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Asignado a:</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-green-500" />
                    <span>{assignee.name}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Descripción de la tarea */}
              <div>
                <h3 className="text-sm font-medium mb-1">Descripción:</h3>
                <p className="text-sm">
                  {task.description || "Sin descripción"}
                </p>
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
                  {task.completedAt && (
                    <div>
                      <h4 className="font-medium mb-1">Completada</h4>
                      <p>
                        {format(new Date(task.completedAt), "Pp", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>

              {canCompleteTask() && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCompleteTask}
                  disabled={isUpdating}
                >
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Completar
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
