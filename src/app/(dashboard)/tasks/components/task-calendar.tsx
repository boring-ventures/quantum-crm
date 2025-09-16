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
import {
  ListTodo,
  Target,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

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

  // Calcular conteo por estado del período visible
  const getTasksCountByStatus = useCallback(() => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();

    const periodTasks = tasks.filter((task) => {
      const taskDate = task.scheduledFor || task.createdAt;
      if (!taskDate) return false;

      const taskDateObj = new Date(taskDate);
      return (
        taskDateObj.getFullYear() === currentYear &&
        taskDateObj.getMonth() === currentMonthNum
      );
    });

    return {
      total: periodTasks.length,
      pending: periodTasks.filter((task) => task.status === "PENDING").length,
      inProgress: periodTasks.filter((task) => task.status === "IN_PROGRESS")
        .length,
      completed: periodTasks.filter((task) => task.status === "COMPLETED")
        .length,
      cancelled: periodTasks.filter((task) => task.status === "CANCELLED")
        .length,
    };
  }, [tasks, currentMonth]);

  // Obtener el nombre del período visible
  const getPeriodName = useCallback(() => {
    if (calendarView === "dayGridMonth") {
      return currentMonth.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
    } else if (calendarView === "timeGridWeek") {
      const weekStart = new Date(currentMonth);
      weekStart.setDate(weekStart.getDate() - currentMonth.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `Semana del ${weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} al ${weekEnd.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    } else if (calendarView === "timeGridDay") {
      return currentMonth.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } else if (calendarView === "listWeek") {
      return `Agenda de la semana del ${currentMonth.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
    }
    return currentMonth.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  }, [calendarView, currentMonth]);

  // Listener para detectar cambios de mes en el calendario
  const handleDatesSet = useCallback((dateInfo: any) => {
    // Actualizar el mes actual para cualquier vista
    if (dateInfo && dateInfo.start) {
      const newMonth = new Date(dateInfo.start);
      setCurrentMonth(newMonth);

      // Debug: mostrar la fecha que se está estableciendo
      console.log("Calendar datesSet:", {
        viewType: dateInfo.view?.type,
        start: dateInfo.start,
        end: dateInfo.end,
        newMonth: newMonth.toISOString(),
      });
    }
  }, []);

  // Filtrar tareas por estado si se especifica - usar useMemo para evitar recálculos innecesarios
  const filteredTasks = useMemo(() => {
    console.log("[TaskCalendar] Filtrando tareas con status:", statusFilter);
    
    let result: Task[];
    if (statusFilter === "all") {
      // Mostrar todas las tareas con ordenamiento por prioridad de estado
      result = [...tasks].sort((a, b) => {
        const statusOrder = { "PENDING": 0, "IN_PROGRESS": 1, "COMPLETED": 2, "CANCELLED": 3 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
        
        // Primero ordenar por estado, luego por fecha de creación (más reciente primero)
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Filtrar por estado específico y ordenar por fecha de creación
      result = tasks
        .filter((task) => task.status === statusFilter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    console.log("[TaskCalendar] Tareas filtradas por status:", result.length);
    return result;
  }, [tasks, statusFilter]);

  // Convertir tareas a formato de eventos para FullCalendar - usar useMemo
  const calendarEvents = useMemo(() => {
    console.log("[TaskCalendar] Tareas filtradas:", filteredTasks.length);
    console.log(
      "[TaskCalendar] Tareas con fecha:",
      filteredTasks.filter((task) => task.scheduledFor || task.createdAt).length
    );

    const events = filteredTasks
      .filter((task) => task.scheduledFor || task.createdAt) // Solo tareas con fecha
      .map((task) => {
        // Usar scheduledFor si existe, sino usar createdAt como fallback
        const eventDate = task.scheduledFor || task.createdAt;

        return {
          id: task.id,
          title: task.title,
          start: eventDate!,
          end: undefined, // No usar completedAt como fecha de fin
          backgroundColor: getTaskColor(task),
          borderColor: getTaskColor(task),
          textColor: getTextColor(task),
          extendedProps: { task },
          allDay: false, // Las tareas no son de todo el día
        };
      });

    console.log("[TaskCalendar] Eventos del calendario:", events.length);
    return events;
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
        left: "",
        center: "",
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
      initialDate: currentMonth, // Establecer la fecha inicial
      fixedWeekCount: false, // No mostrar 6 semanas siempre
      showNonCurrentDates: false, // No mostrar fechas de meses anteriores/siguientes
      dayMaxEvents: true, // Mostrar "más" cuando hay muchos eventos
    };

    const calendarInstance = new Calendar(calendarEl, options);
    calendarInstance.render();
    setCalendarApi(calendarInstance);

    // Sincronizar el estado inicial con la vista del calendario
    const initialDate = calendarInstance.getDate();
    setCurrentMonth(initialDate);

    return () => {
      calendarInstance.destroy();
    };
  }, [
    calendarEl,
    calendarView,
    handleDatesSet,
    calendarEvents,
    handleEventClick,
    renderEventContent,
    renderDayCellContent,
  ]); // Solo recrear cuando cambie el elemento o la vista

  // Actualizar eventos cuando cambien las tareas
  useEffect(() => {
    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
    }
  }, [calendarApi, calendarEvents]);

  // Sincronizar el estado currentMonth cuando cambie la vista
  useEffect(() => {
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      setCurrentMonth(currentDate);
    }
  }, [calendarView, calendarApi]);

  // Sincronizar el estado inicial cuando se monte el componente
  useEffect(() => {
    // Establecer la fecha actual como valor inicial
    setCurrentMonth(new Date());
  }, []);

  // Cambiar la vista del calendario
  const changeView = useCallback(
    (view: string) => {
      setCalendarView(view);
      if (calendarApi) {
        calendarApi.changeView(view);
        // Actualizar el mes actual cuando se cambie la vista
        const currentDate = calendarApi.getDate();
        setCurrentMonth(currentDate);
      }
    },
    [calendarApi]
  );

  // Navegar al período anterior
  const goToPreviousPeriod = useCallback(() => {
    if (calendarApi) {
      calendarApi.prev();
      const currentDate = calendarApi.getDate();
      setCurrentMonth(currentDate);
    }
  }, [calendarApi]);

  // Navegar al período siguiente
  const goToNextPeriod = useCallback(() => {
    if (calendarApi) {
      calendarApi.next();
      const currentDate = calendarApi.getDate();
      setCurrentMonth(currentDate);
    }
  }, [calendarApi]);

  // Ir al período actual
  const goToToday = useCallback(() => {
    if (calendarApi) {
      calendarApi.today();
      setCurrentMonth(new Date());
    }
  }, [calendarApi]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        {/* Contador de tareas del período visible con desglose por estado */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">
              {getPeriodName()}:
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center gap-1">
            <ListTodo className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-600">
              {getTasksCountByStatus().total}
            </span>
          </div>

          {/* Pendientes */}
          {getTasksCountByStatus().pending > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-600">
                {getTasksCountByStatus().pending}
              </span>
            </div>
          )}

          {/* En Progreso */}
          {getTasksCountByStatus().inProgress > 0 && (
            <div className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-600">
                {getTasksCountByStatus().inProgress}
              </span>
            </div>
          )}

          {/* Completadas */}
          {getTasksCountByStatus().completed > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {getTasksCountByStatus().completed}
              </span>
            </div>
          )}

          {/* Canceladas */}
          {getTasksCountByStatus().cancelled > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-600">
                {getTasksCountByStatus().cancelled}
              </span>
            </div>
          )}
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

          {/* Botones de navegación estéticos */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPeriod}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950 dark:to-indigo-950 dark:hover:from-blue-900 dark:hover:to-indigo-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-950 dark:to-emerald-950 dark:hover:from-green-900 dark:hover:to-emerald-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Hoy
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPeriod}
              className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-950 dark:to-pink-950 dark:hover:from-purple-900 dark:hover:to-pink-900 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
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
