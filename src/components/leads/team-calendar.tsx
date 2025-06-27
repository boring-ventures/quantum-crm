"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { useTeamTestDriveTasks } from "@/lib/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";

interface TeamCalendarProps {
  selectedDate?: Date;
}

export function TeamCalendar({ selectedDate }: TeamCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(
    selectedDate
      ? startOfWeek(selectedDate, { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = currentWeek;
  const weekEnd = addDays(endOfWeek(currentWeek, { weekStartsOn: 1 }), 7);

  const { data: teamTasks, isLoading } = useTeamTestDriveTasks(
    weekStart,
    weekEnd
  );

  // Agrupar tareas por día y filtrar solo días con tareas
  const daysWithTasks = useMemo(() => {
    if (!teamTasks || teamTasks.length === 0) return [];

    const tasksByDay = teamTasks.reduce(
      (acc, task) => {
        if (!task.scheduledFor) return acc;

        const taskDate = parseISO(task.scheduledFor);
        const dayKey = format(taskDate, "yyyy-MM-dd");

        if (!acc[dayKey]) {
          acc[dayKey] = {
            date: taskDate,
            tasks: [],
          };
        }
        acc[dayKey].tasks.push(task);

        return acc;
      },
      {} as Record<string, { date: Date; tasks: typeof teamTasks }>
    );

    // Convertir a array y ordenar por fecha
    return Object.values(tasksByDay).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [teamTasks]);

  const getTaskTypeColor = (title: string) => {
    if (title.toLowerCase().includes("test drive")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (title.toLowerCase().includes("visita")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendario del Equipo - Test Drives y Visitas
        </CardTitle>
        <p className="text-sm text-gray-500">
          Del {format(weekStart, "dd MMM", { locale: es })} al{" "}
          {format(weekEnd, "dd MMM yyyy", { locale: es })}
        </p>
      </CardHeader>
      <CardContent>
        {daysWithTasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay test drives ni visitas programadas en este período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {daysWithTasks.map(({ date, tasks }) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <div
                  key={format(date, "yyyy-MM-dd")}
                  className={`border rounded-lg p-4 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="font-semibold text-lg">
                      {format(date, "EEEE, dd 'de' MMMM", { locale: es })}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tasks.length} evento{tasks.length > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {task.scheduledFor &&
                                format(parseISO(task.scheduledFor), "HH:mm")}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTaskTypeColor(task.title)}`}
                          >
                            {task.title}
                          </Badge>
                        </div>

                        {(task as any).lead && (
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {(task as any).lead.firstName}{" "}
                            {(task as any).lead.lastName}
                          </div>
                        )}

                        {(task as any).assignedTo && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-3 w-3" />
                            {(task as any).assignedTo.name}
                          </div>
                        )}

                        {task.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
