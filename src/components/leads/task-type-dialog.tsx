"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Car,
  Mail,
  Phone,
  Home,
  Store,
  MessageSquare,
  MessageCircle,
} from "lucide-react";

interface TaskType {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const taskTypes: TaskType[] = [
  {
    id: "test-drive",
    icon: <Car className="h-5 w-5" />,
    title: "Test Drive",
    description: "Programar prueba de manejo",
  },
  {
    id: "email",
    icon: <Mail className="h-5 w-5" />,
    title: "Enviar eMail",
    description: "Enviar un correo electrónico al cliente",
  },
  {
    id: "call",
    icon: <Phone className="h-5 w-5" />,
    title: "Llamar",
    description: "Realizar una llamada telefónica",
  },
  {
    id: "visit-client",
    icon: <Home className="h-5 w-5" />,
    title: "Visitar al Cliente",
    description: "Programar una visita al domicilio",
  },
  {
    id: "client-visit",
    icon: <Store className="h-5 w-5" />,
    title: "Cliente visita salon",
    description: "Programar visita al showroom",
  },
  {
    id: "sms",
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Enviar SMS",
    description: "Enviar un mensaje de texto",
  },
  {
    id: "whatsapp",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Enviar Whatsapp",
    description: "Enviar un mensaje por WhatsApp",
  },
];

interface TaskTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSelectTaskType?: (taskType: TaskType) => void;
}

export function TaskTypeDialog({
  open,
  onOpenChange,
  leadId,
  onSelectTaskType,
}: TaskTypeDialogProps) {
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);

  const handleTaskTypeSelect = (taskType: TaskType) => {
    setSelectedTaskType(taskType.id);
    if (onSelectTaskType) {
      onSelectTaskType(taskType);
    }
  };

  const handleContinue = () => {
    // Esta función se implementará en la próxima etapa
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Asistente Nueva Tarea</DialogTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            ¿Cuál es tu próxima tarea para este cliente?
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {taskTypes.map((taskType) => (
            <div
              key={taskType.id}
              className={`
                p-4 border rounded-md cursor-pointer transition-all 
                hover:border-blue-600 hover:shadow-sm
                ${selectedTaskType === taskType.id ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}
              `}
              onClick={() => handleTaskTypeSelect(taskType)}
            >
              <div className="flex items-center gap-3">
                {taskType.icon}
                <div>
                  <p className="font-medium">{taskType.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {taskType.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!selectedTaskType} onClick={handleContinue}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
