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
  Calendar,
  Clock,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateTaskMutation } from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/auth-provider";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  initialStep?: 1 | 2;
  preselectedTaskType?: string | null;
}

export function TaskTypeDialog({
  open,
  onOpenChange,
  leadId,
  initialStep = 1,
  preselectedTaskType = null,
}: TaskTypeDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("12:00");
  const { user } = useAuth();
  const createTaskMutation = useCreateTaskMutation();
  const { toast } = useToast();

  // Resetear el estado cuando se abre/cierra el diálogo
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedTaskType(null);
      setDescription("");
      setDate(undefined);
      setTime("12:00");
    } else {
      // Si se proporciona un paso inicial y un tipo de tarea preseleccionado
      if (initialStep === 2 && preselectedTaskType) {
        setStep(2);
        setSelectedTaskType(preselectedTaskType);
      }
    }
  }, [open, initialStep, preselectedTaskType]);

  const handleTaskTypeSelect = (taskType: TaskType) => {
    setSelectedTaskType(taskType.id);
  };

  const handleNextStep = () => {
    if (selectedTaskType) {
      setStep(2);
    }
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const getSelectedTaskTitle = () => {
    if (!selectedTaskType) return "";
    return taskTypes.find((type) => type.id === selectedTaskType)?.title || "";
  };

  const handleCreateTask = async () => {
    if (!selectedTaskType || !user?.id) return;

    const selectedType = taskTypes.find((type) => type.id === selectedTaskType);
    if (!selectedType) return;

    // Construir fecha y hora programada
    let scheduledFor: Date | undefined = undefined;
    if (date) {
      scheduledFor = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(":").map(Number);
        scheduledFor.setHours(hours, minutes);
      }
    }

    try {
      await createTaskMutation.mutateAsync({
        leadId,
        title: selectedType.title,
        assignedToId: user.id,
        description: description.trim() || undefined,
        scheduledFor: scheduledFor || undefined,
      });

      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      });

      // Cerrar el diálogo y resetear
      onOpenChange(false);
    } catch (error) {
      console.error("Error al crear la tarea:", error);
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
          <DialogTitle className="text-xl">
            {step === 1
              ? "Asistente Nueva Tarea"
              : `Nueva tarea: ${getSelectedTaskTitle()}`}
          </DialogTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {step === 1
              ? "¿Cuál es tu próxima tarea para este cliente?"
              : "Programa cuando quieres realizar esta tarea y agrega notas si es necesario"}
          </p>
        </DialogHeader>

        {step === 1 ? (
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
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        style={{ pointerEvents: "auto" }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Notas adicionales (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Agrega detalles o información adicional sobre esta tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-32 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!selectedTaskType}
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBackStep}>
                Atrás
              </Button>
              <Button
                disabled={createTaskMutation.isPending}
                onClick={handleCreateTask}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear tarea
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
