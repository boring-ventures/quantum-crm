"use client";

import { Calendar, Clock, Phone, Mail, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Task = {
  id: string;
  type: "llamada" | "email" | "reunion" | "documento";
  title: string;
  leadName: string;
  time: string;
  date: string;
  status: "pendiente" | "completada" | "atrasada";
};

// Datos de ejemplo para las tareas pendientes
const mockTasks: Task[] = [
  {
    id: "1",
    type: "llamada",
    title: "Llamada de seguimiento",
    leadName: "Carlos Mendoza",
    time: "15:00",
    date: "Hoy",
    status: "pendiente",
  },
  {
    id: "2",
    type: "email",
    title: "Enviar cotización",
    leadName: "María López",
    time: "10:00",
    date: "Mañana",
    status: "pendiente",
  },
  {
    id: "3",
    type: "reunion",
    title: "Demostración de producto",
    leadName: "Jorge Céspedes",
    time: "14:30",
    date: "Jueves",
    status: "pendiente",
  },
  {
    id: "4",
    type: "documento",
    title: "Preparar contrato",
    leadName: "Ana Martínez",
    time: "12:00",
    date: "Viernes",
    status: "pendiente",
  },
  {
    id: "5",
    type: "llamada",
    title: "Llamada de seguimiento",
    leadName: "Roberto Sánchez",
    time: "16:30",
    date: "Ayer",
    status: "atrasada",
  },
];

interface TaskItemProps {
  task: Task;
}

function TaskItem({ task }: TaskItemProps) {
  // Obtener el icono adecuado según el tipo de tarea
  const getTaskIcon = () => {
    switch (task.type) {
      case "llamada":
        return <Phone className="h-4 w-4 mr-2 text-blue-400" />;
      case "email":
        return <Mail className="h-4 w-4 mr-2 text-green-400" />;
      case "reunion":
        return <Calendar className="h-4 w-4 mr-2 text-purple-400" />;
      case "documento":
        return <FileText className="h-4 w-4 mr-2 text-orange-400" />;
      default:
        return <Clock className="h-4 w-4 mr-2 text-gray-400" />;
    }
  };

  // Obtener el color del badge según el estado
  const getStatusColor = () => {
    switch (task.status) {
      case "completada":
        return "bg-green-100 text-green-800 border-green-200";
      case "atrasada":
        return "bg-red-100 text-red-800 border-red-200";
      case "pendiente":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="border-b border-gray-700 py-3 last:border-0">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center">
          {getTaskIcon()}
          <span className="font-medium text-gray-200">{task.title}</span>
        </div>
        <Badge className={`text-xs ${getStatusColor()}`}>{task.status}</Badge>
      </div>
      <div className="ml-6 text-sm text-gray-400">{task.leadName}</div>
      <div className="ml-6 flex items-center mt-1 text-xs text-gray-500">
        <Clock className="h-3 w-3 mr-1" />
        {task.time}, {task.date}
      </div>
    </div>
  );
}

export function PendingTasks() {
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Tareas pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {mockTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
