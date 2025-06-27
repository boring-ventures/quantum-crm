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

  // Obtener los días de dos semanas
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  // Agrupar tareas por día
  const tasksByDay = useMemo(() => {
    if (!teamTasks) return {};

    return teamTasks.reduce(
      (acc, task) => {
        if (!task.scheduledFor) return acc;

        const taskDate = parseISO(task.scheduledFor);
        const dayKey = format(taskDate, "yyyy-MM-dd");

        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(task);

        return acc;
      },
      {} as Record<string, typeof teamTasks>
    );
  }, [teamTasks]);

  const getTasksForDay = (date: Date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    return tasksByDay[dayKey] || [];
  };

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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={`border rounded-lg p-2 min-h-[120px] ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="font-medium text-sm mb-2">
                  {format(day, "EEE dd", { locale: es })}
                </div>

                <div className="space-y-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs p-1 rounded border-l-2 border-blue-400"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {task.scheduledFor &&
                          format(parseISO(task.scheduledFor), "HH:mm")}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${getTaskTypeColor(task.title)}`}
                      >
                        {task.title}
                      </Badge>

                      {(task as any).lead && (
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {(task as any).lead.firstName}{" "}
                          {(task as any).lead.lastName}
                        </div>
                      )}

                      {(task as any).assignedTo && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="h-3 w-3" />
                          {(task as any).assignedTo.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {dayTasks.length === 0 && (
                  <div className="text-xs text-gray-400 italic">
                    Sin eventos
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {teamTasks && teamTasks.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay test drives ni visitas programadas esta semana</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
