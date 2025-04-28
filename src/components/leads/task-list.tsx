"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, Check, Plus, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/lead";
import { TaskTypeDialog } from "@/components/leads/task-type-dialog";
import { useLeadTasks } from "@/lib/hooks/use-tasks";

interface TaskListProps {
  leadId: string;
}

export function TaskList({ leadId }: TaskListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: tasks, isLoading } = useLeadTasks(leadId);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "IN_PROGRESS":
        return "En progreso";
      case "COMPLETED":
        return "Completado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

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

  // Ordenar las tareas por fecha de vencimiento
  const sortedTasks = Object.keys(groupedTasks).reduce(
    (sorted, status) => {
      sorted[status] = [...groupedTasks[status]].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
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
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Crear primera tarea
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tareas pendientes</h3>
        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Cargando tareas...
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
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                      Pendientes
                    </h4>
                  )}
                  {status === "COMPLETED" && (
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6">
                      Completadas
                    </h4>
                  )}
                  {sortedTasks[status].map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            {task.title}
                          </h5>
                          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <CalendarClock className="h-4 w-4 mr-1" />
                            {format(
                              new Date(task.dueDate),
                              "d 'de' MMMM, yyyy - HH:mm",
                              { locale: es }
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Badge
                            variant="outline"
                            className={`${getStatusBadgeStyle(task.status)}`}
                          >
                            {getStatusText(task.status)}
                          </Badge>
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}

                      {task.status === "PENDING" && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-900/20"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Completar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      )}

      <TaskTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        leadId={leadId}
      />
    </div>
  );
}
