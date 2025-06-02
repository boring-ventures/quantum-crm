"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateTaskStatusMutation } from "@/lib/hooks";
import { Task } from "@/types/lead";
import { useUserStore } from "@/store/userStore";
import { hasPermission, getScope } from "@/lib/utils/permissions";

interface PendingTasksProps {
  assignedToId?: string;
  countryId?: string;
  currentUser?: any;
}

export function PendingTasks({
  assignedToId,
  countryId,
  currentUser,
}: PendingTasksProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const { user } = useUserStore();

  // Determinar si el usuario es vendedor (solo puede ver sus tareas)
  const canViewOwnTasks =
    hasPermission(user, "tasks", "view") &&
    getScope(user, "tasks", "view") === "self";
  const effectiveAssignedToId =
    canViewOwnTasks && !assignedToId ? user?.id : assignedToId;

  // Cargar las tareas pendientes
  useEffect(() => {
    const fetchPendingTasks = async () => {
      try {
        setIsLoading(true);
        let url = "/api/tasks/pending";
        const params = new URLSearchParams();
        if (effectiveAssignedToId) {
          params.append("assignedToId", effectiveAssignedToId);
        }
        if (countryId) {
          params.append("countryId", countryId);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al cargar tareas pendientes");
        }
        const data = await response.json();
        const filteredTasks = data.filter(
          (task: any) => !task.lead.isArchived && !task.lead.isClosed
        );
        setTasks(filteredTasks);
      } catch (error) {
        console.error("Error cargando tareas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las tareas pendientes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendingTasks();
  }, [toast, effectiveAssignedToId, countryId]);

  // Manejar la actualización del estado de la tarea
  const handleCompleteTask = async (taskId: string, leadId: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId,
        leadId,
        status: "COMPLETED",
      });
      setTasks(tasks.filter((task) => task.id !== taskId));
      toast({
        title: "Tarea completada",
        description: "La tarea ha sido marcada como completada correctamente",
      });
    } catch (error) {
      console.error("Error al completar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive",
      });
    }
  };

  // Determinar la prioridad de la tarea basada en la fecha programada
  const getTaskPriority = (task: Task) => {
    if (!task.scheduledFor) return "low";
    const now = new Date();
    const scheduledDate = new Date(task.scheduledFor);
    const diffTime = scheduledDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    if (diffDays < 0) return "high";
    if (diffDays < 1) return "high";
    if (diffDays < 2) return "medium";
    return "low";
  };

  const formatScheduledTime = (scheduledFor?: string) => {
    if (!scheduledFor) return "No programada";
    const scheduledDate = new Date(scheduledFor);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear()
    ) {
      return `Hoy, ${format(scheduledDate, "HH:mm", { locale: es })}`;
    } else if (
      scheduledDate.getDate() === tomorrow.getDate() &&
      scheduledDate.getMonth() === tomorrow.getMonth() &&
      scheduledDate.getFullYear() === tomorrow.getFullYear()
    ) {
      return `Mañana, ${format(scheduledDate, "HH:mm", { locale: es })}`;
    } else {
      return format(scheduledDate, "dd/MM/yyyy, HH:mm", { locale: es });
    }
  };

  const getLeadInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 dark:text-gray-400">
          No hay tareas pendientes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                {getLeadInitials(task.lead.firstName, task.lead.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {task.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {task.lead.firstName} {task.lead.lastName}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {task.scheduledFor && (
                  <>
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatScheduledTime(task.scheduledFor)}
                    </span>
                  </>
                )}
                <Badge
                  variant="secondary"
                  className={
                    getTaskPriority(task) === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : getTaskPriority(task) === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }
                >
                  {getTaskPriority(task) === "high"
                    ? "Alta"
                    : getTaskPriority(task) === "medium"
                      ? "Media"
                      : "Baja"}
                </Badge>
              </div>
            </div>
            {canViewOwnTasks && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-green-600 dark:hover:text-green-500"
                onClick={() => handleCompleteTask(task.id, task.leadId)}
                disabled={updateTaskStatusMutation.isPending}
              >
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
