"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { useCreateTaskMutation } from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

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
}

export function TaskTypeDialog({
  open,
  onOpenChange,
  leadId,
}: TaskTypeDialogProps) {
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const { user } = useAuth();
  const createTaskMutation = useCreateTaskMutation();
  const { toast } = useToast();

  const handleTaskTypeSelect = (taskType: TaskType) => {
    setSelectedTaskType(taskType.id);
  };

  const handleCreateTask = async () => {
    if (!selectedTaskType) return;

    const selectedType = taskTypes.find((type) => type.id === selectedTaskType);
    if (!selectedType) return;

    console.log("selectedType", selectedType);

    try {
      await createTaskMutation.mutateAsync({
        leadId,
        title: selectedType.title,
        assignedToId: user?.id || "",
      });

      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      });

      // Cerrar el diálogo y resetear la selección
      onOpenChange(false);
      setSelectedTaskType(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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
          <Button
            disabled={!selectedTaskType || createTaskMutation.isPending}
            onClick={handleCreateTask}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createTaskMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
