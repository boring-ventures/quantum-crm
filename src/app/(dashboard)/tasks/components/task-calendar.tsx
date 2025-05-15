"use client";

import { useEffect, useState } from "react";
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

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [calendarEl, setCalendarEl] = useState<HTMLDivElement | null>(null);
  const [calendarApi, setCalendarApi] = useState<Calendar | null>(null);
  const [calendarView, setCalendarView] = useState<string>("dayGridMonth");

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
      events: formatTasksAsEvents(tasks),
      eventClick: handleEventClick,
      eventContent: renderEventContent,
      dayCellContent: renderDayCellContent,
      height: "auto",
      firstDay: 1, // Lunes es el primer día
    };

    const calendarInstance = new Calendar(calendarEl, options);
    calendarInstance.render();
    setCalendarApi(calendarInstance);

    return () => {
      calendarInstance.destroy();
    };
  }, [calendarEl, tasks, calendarView]);

  // Cambiar la vista del calendario
  const changeView = (view: string) => {
    setCalendarView(view);
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  };

  // Convertir tareas a formato de eventos para FullCalendar
  const formatTasksAsEvents = (tasks: Task[]) => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.scheduledFor || task.createdAt,
      end: task.completedAt || undefined,
      backgroundColor: getTaskColor(task),
      borderColor: getTaskColor(task),
      textColor: "#fff",
      extendedProps: { task },
    }));
  };

  // Obtener color según prioridad/estado
  const getTaskColor = (task: Task) => {
    if (task.status === "COMPLETED") return "#94a3b8"; // Gris

    // Una vez que implementemos prioridad, podemos usar:
    // if (task.priority === "high") return "#ef4444"; // Rojo
    // if (task.priority === "medium") return "#f97316"; // Naranja
    // if (task.priority === "low") return "#22c55e"; // Verde

    // Por ahora, usamos el estado como indicador
    if (task.status === "IN_PROGRESS") return "#3b82f6"; // Azul
    if (task.status === "PENDING") return "#f97316"; // Naranja
    if (task.status === "CANCELLED") return "#94a3b8"; // Gris

    return "#3b82f6"; // Azul por defecto
  };

  // Manejar click en evento
  const handleEventClick = (info: EventClickArg) => {
    const task = info.event.extendedProps.task as Task;
    onTaskClick(task);
  };

  // Renderizar contenido del evento
  const renderEventContent = (eventInfo: EventContentArg) => {
    const task = eventInfo.event.extendedProps.task as Task;

    return {
      html: `
        <div class="fc-event-main-frame">
          <div class="fc-event-title-container">
            <div class="fc-event-title fc-sticky">
              ${eventInfo.event.title}
              ${
                task.status === "COMPLETED"
                  ? '<span style="margin-left: 4px">✓</span>'
                  : ""
              }
            </div>
          </div>
        </div>
      `,
    };
  };

  // Renderizar contenido de celda de día
  const renderDayCellContent = (arg: DayCellContentArg) => {
    return {
      html: `<div class="fc-daygrid-day-number">${arg.dayNumberText}</div>`,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end mb-4">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarApi?.prev()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarApi?.today()}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarApi?.next()}
          >
            Siguiente
          </Button>
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
