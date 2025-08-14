"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Calendar,
  DayCellContentArg,
  CalendarOptions,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { Task } from "@/types/lead";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/context/theme-context";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  statusFilter?: string;
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  statusFilter = "all",
}: TaskCalendarProps) {
  const [calendarEl, setCalendarEl] = useState<HTMLDivElement | null>(null);
  const [calendarApi, setCalendarApi] = useState<Calendar | null>(null);
  const [calendarView, setCalendarView] = useState<string>("dayGridMonth");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { theme } = useTheme();

  // Obtener color según estado con soporte para modo claro/oscuro
  const getTaskColor = useCallback(
    (task: Task) => {
      const isDark = theme === "dark";

      switch (task.status) {
        case "COMPLETED":
          return isDark ? "#059669" : "#10b981"; // Verde
        case "IN_PROGRESS":
          return isDark ? "#2563eb" : "#3b82f6"; // Azul
        case "PENDING":
          return isDark ? "#ea580c" : "#f97316"; // Naranja
        case "CANCELLED":
          return isDark ? "#6b7280" : "#9ca3af"; // Gris
        default:
          return isDark ? "#3b82f6" : "#3b82f6"; // Azul por defecto
      }
    },
    [theme]
  );

  // Obtener color del texto según el fondo
  const getTextColor = useCallback(
    (task: Task) => {
      const isDark = theme === "dark";

      switch (task.status) {
        case "COMPLETED":
          return isDark ? "#ffffff" : "#ffffff";
        case "IN_PROGRESS":
          return isDark ? "#ffffff" : "#ffffff";
        case "PENDING":
          return isDark ? "#ffffff" : "#ffffff";
        case "CANCELLED":
          return isDark ? "#ffffff" : "#1f2937";
        default:
          return "#ffffff";
      }
    },
    [theme]
  );

  // Calcular total de tareas del mes visible
  const getTotalTasksForMonth = useCallback(() => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();

    return tasks.filter((task) => {
      // Incluir tareas que tengan cualquier fecha (createdAt, scheduledFor, completedAt)
      const taskDate = task.scheduledFor || task.createdAt;
      if (!taskDate) return false;

      const taskDateObj = new Date(taskDate);
      return (
        taskDateObj.getFullYear() === currentYear &&
        taskDateObj.getMonth() === currentMonthNum
      );
    }).length;
  }, [tasks, currentMonth]);

  // Listener para detectar cambios de mes en el calendario
  const handleDatesSet = useCallback((dateInfo: any) => {
    if (dateInfo.view.type === "dayGridMonth") {
      const newMonth = new Date(dateInfo.start);
      setCurrentMonth(newMonth);
    }
  }, []);

  // Filtrar tareas por estado si se especifica - usar useMemo para evitar recálculos innecesarios
  const filteredTasks = useMemo(() => {
    return statusFilter === "all"
      ? tasks.filter((task) => task.scheduledFor) // Solo tareas programadas
      : tasks.filter(
          (task) => task.scheduledFor && task.status === statusFilter
        );
  }, [tasks, statusFilter]);

  // Convertir tareas a formato de eventos para FullCalendar - usar useMemo
  const calendarEvents = useMemo(() => {
    return filteredTasks
      .filter((task) => task.scheduledFor) // Solo tareas programadas
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: task.scheduledFor!, // Usar ! porque ya filtramos por scheduledFor
        end: undefined, // No usar completedAt como fecha de fin
        backgroundColor: getTaskColor(task),
        borderColor: getTaskColor(task),
        textColor: getTextColor(task),
        extendedProps: { task },
        allDay: false, // Las tareas no son de todo el día
      }));
  }, [filteredTasks, getTaskColor, getTextColor]);

  // Manejar click en evento
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const task = info.event.extendedProps.task as Task;
      onTaskClick(task);
    },
    [onTaskClick]
  );

  // Renderizar contenido del evento
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const task = eventInfo.event.extendedProps.task as Task;

    return {
      html: `
        <div class="fc-event-main-frame">
          <div class="fc-event-title-container">
            <div class="fc-event-title fc-sticky">
              ${eventInfo.event.title}
              ${
                task.status === "COMPLETED"
                  ? '<span style="margin-left: 4px; font-weight: bold;">✓</span>'
                  : ""
              }
            </div>
          </div>
        </div>
      `,
    };
  }, []);

  // Renderizar contenido de celda de día
  const renderDayCellContent = useCallback((arg: DayCellContentArg) => {
    return {
      html: `<div class="fc-daygrid-day-number">${arg.dayNumberText}</div>`,
    };
  }, []);

  // Inicializar calendario cuando el elemento está disponible
  useEffect(() => {
    if (!calendarEl) return;

    const options: CalendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: calendarView,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "",
      },
      locale: "es",
      events: calendarEvents,
      eventClick: handleEventClick,
      eventContent: renderEventContent,
      dayCellContent: renderDayCellContent,
      height: "auto",
      firstDay: 1, // Lunes es el primer día
      eventDisplay: "block", // Mostrar eventos como bloques
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        hour12: false,
      },
      datesSet: handleDatesSet, // Agregar el listener
    };

    const calendarInstance = new Calendar(calendarEl, options);
    calendarInstance.render();
    setCalendarApi(calendarInstance);

    return () => {
      calendarInstance.destroy();
    };
  }, [calendarEl, calendarView, handleDatesSet]); // Solo recrear cuando cambie el elemento o la vista

  // Actualizar eventos cuando cambien las tareas
  useEffect(() => {
    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
    }
  }, [calendarApi, calendarEvents]);

  // Cambiar la vista del calendario
  const changeView = useCallback(
    (view: string) => {
      setCalendarView(view);
      if (calendarApi) {
        calendarApi.changeView(view);
      }
    },
    [calendarApi]
  );

  // Navegar al mes anterior
  const goToPreviousMonth = useCallback(() => {
    if (calendarApi) {
      calendarApi.prev();
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentMonth(newDate);
    }
  }, [calendarApi, currentMonth]);

  // Navegar al mes siguiente
  const goToNextMonth = useCallback(() => {
    if (calendarApi) {
      calendarApi.next();
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
    }
  }, [calendarApi, currentMonth]);

  // Ir al mes actual
  const goToToday = useCallback(() => {
    if (calendarApi) {
      calendarApi.today();
      setCurrentMonth(new Date());
    }
  }, [calendarApi]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        {/* Contador de tareas del mes visible */}
        <div className="text-sm text-muted-foreground">
          {getTotalTasksForMonth()} tarea
          {getTotalTasksForMonth() !== 1 ? "s" : ""} del mes de{" "}
          {currentMonth.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          })}
        </div>

        {/* Controles del calendario */}
        <div className="flex flex-wrap gap-2">
          <Select value={calendarView} onValueChange={changeView}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Mes</SelectItem>
              <SelectItem value="timeGridWeek">Semana</SelectItem>
              <SelectItem value="timeGridDay">Día</SelectItem>
              <SelectItem value="listWeek">Agenda</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={setCalendarEl}
        className="fc fc-media-screen fc-direction-ltr fc-theme-standard"
        style={{ height: "650px" }}
      />
    </div>
  );
}
