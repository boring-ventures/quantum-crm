"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Tipo para los eventos del calendario
type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "llamada" | "reunion" | "email" | "seguimiento";
  leadName: string;
};

// Datos de ejemplo para el calendario
const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Llamada inicial",
    date: new Date(2023, 10, 15, 10, 0),
    type: "llamada",
    leadName: "Carlos Méndez",
  },
  {
    id: "2",
    title: "Presentación de propuesta",
    date: new Date(2023, 10, 17, 15, 30),
    type: "reunion",
    leadName: "María López",
  },
  {
    id: "3",
    title: "Seguimiento de cotización",
    date: new Date(2023, 10, 20, 11, 0),
    type: "seguimiento",
    leadName: "Jorge Pérez",
  },
  {
    id: "4",
    title: "Envío de contrato",
    date: new Date(2023, 10, 22, 9, 0),
    type: "email",
    leadName: "Ana Martínez",
  },
  {
    id: "5",
    title: "Llamada de cierre",
    date: new Date(2023, 10, 25, 16, 0),
    type: "llamada",
    leadName: "Roberto Sánchez",
  },
];

// Función para obtener los eventos de un día específico
function getEventsForDay(date: Date | undefined): CalendarEvent[] {
  if (!date) return [];

  return mockEvents.filter(
    (event) =>
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
  );
}

// Función para verificar si un día tiene eventos
function dayHasEvents(date: Date): boolean {
  return mockEvents.some(
    (event) =>
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
  );
}

// Componente para renderizar un evento individual
function EventItem({ event }: { event: CalendarEvent }) {
  // Obtener el color del badge según el tipo de evento
  const getBadgeColor = () => {
    switch (event.type) {
      case "llamada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "reunion":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "email":
        return "bg-green-100 text-green-800 border-green-200";
      case "seguimiento":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-2 border-b border-gray-700 last:border-0">
      <div className="flex justify-between items-start">
        <span className="font-medium text-sm text-gray-200">{event.title}</span>
        <Badge className={`text-xs ${getBadgeColor()}`}>{event.type}</Badge>
      </div>
      <div className="text-xs text-gray-400 mt-1">{event.leadName}</div>
      <div className="text-xs text-gray-500 mt-1">
        {event.date.getHours().toString().padStart(2, "0")}:
        {event.date.getMinutes().toString().padStart(2, "0")}
      </div>
    </div>
  );
}

export function LeadCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const selectedDayEvents = getEventsForDay(date);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="md:col-span-3 bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border border-gray-700"
            modifiers={{
              hasEvent: (date) => dayHasEvents(date),
            }}
            modifiersClassNames={{
              hasEvent: "bg-blue-900/20 font-bold text-blue-300",
            }}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Eventos{" "}
            {date?.toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-0">
              {selectedDayEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No hay eventos para este día
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
