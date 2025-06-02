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
import { Task } from "@/types/lead";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateTaskStatusMutation } from "@/lib/hooks";
import { hasPermission, getScope } from "@/lib/utils/permissions";

interface TaskDetailsDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: any;
}

export function TaskDetailsDialog({
  taskId,
  open,
  onOpenChange,
  currentUser,
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
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error("Error al cargar los detalles de la tarea");
        }
        const data = await response.json();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
            Completada
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50">
            En progreso
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50">
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
            Pendiente
          </Badge>
        );
    }
  };

  // Verificar si la tarea se puede completar
  const canCompleteTask = () => {
    return task?.status === "PENDING" && canModifyThisTask() && !isUpdating;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Tarea</DialogTitle>
        </DialogHeader>

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
          <div className="py-4 space-y-5">
            {/* Título y estado */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              {getStatusBadge(task.status)}
            </div>

            {/* Detalles */}
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Descripción
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {task.description || "Sin descripción"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Creada el
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {format(new Date(task.createdAt), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {task.scheduledFor && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      Programada para
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      {format(
                        new Date(task.scheduledFor),
                        "d 'de' MMMM, yyyy • HH:mm",
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      Asignada a
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {assignee.name}
                    </p>
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      Completada el
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {format(
                        new Date(task.completedAt),
                        "d 'de' MMMM, yyyy • HH:mm",
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          {canCompleteTask() && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleCompleteTask}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar como completada
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
