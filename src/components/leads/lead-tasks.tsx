"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useLeadTasks,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useUpdateTaskCompletionNotesMutation,
} from "@/lib/hooks";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface LeadTasksProps {
  leadId: string;
}

export function LeadTasks({ leadId }: LeadTasksProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCompletionNotesDialog, setShowCompletionNotesDialog] =
    useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [taskToComplete, setTaskToComplete] = useState<any>(null);

  const { data: tasks, isLoading } = useLeadTasks(leadId);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const updateCompletionNotesMutation = useUpdateTaskCompletionNotesMutation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dueDate || !user?.id) {
      toast({
        title: "Error",
        description: "Falta información requerida para crear la tarea",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        leadId,
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: user.id,
        scheduledFor: dueDate,
      });

      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      });

      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setOpen(false);
    } catch (error) {
      console.error("Error al crear tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    taskId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId,
        leadId,
        status,
      });
    } catch (error) {
      console.error("Error al actualizar estado de tarea:", error);
    }
  };

  const handleCompleteTask = (task: any) => {
    setTaskToComplete(task);
    setShowCompletionNotesDialog(true);
  };

  const handleConfirmCompleteTask = async () => {
    if (!taskToComplete || !completionNotes.trim()) return;

    try {
      // Primero actualizar el estado de la tarea
      await updateTaskStatusMutation.mutateAsync({
        taskId: taskToComplete.id,
        leadId,
        status: "COMPLETED",
      });

      // Luego actualizar las notas de finalización
      await updateCompletionNotesMutation.mutateAsync({
        taskId: taskToComplete.id,
        leadId,
        completionNotes: completionNotes.trim(),
      });

      toast({
        title: "Tarea completada",
        description:
          "La tarea se ha completado correctamente con las notas de finalización",
      });

      setShowCompletionNotesDialog(false);
      setCompletionNotes("");
      setTaskToComplete(null);
    } catch (error) {
      console.error("Error al completar tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive">Alta</Badge>;
      case "MEDIUM":
        return <Badge variant="default">Media</Badge>;
      case "LOW":
        return <Badge variant="secondary">Baja</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tareas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Nueva tarea</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva tarea</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Título
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la tarea"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descripción (opcional)
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción detallada"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Fecha de vencimiento
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? (
                        format(dueDate, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={
                    !title.trim() || !dueDate || createTaskMutation.isPending
                  }
                >
                  Crear tarea
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Cargando tareas...</div>
        ) : tasks?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay tareas para este lead
          </div>
        ) : (
          tasks?.map((task: any) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{task.title}</h4>
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <div className="space-y-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-500">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Notas al crear la tarea:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    )}
                    {task.completionNotes && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-500">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                          Notas de finalización:
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {task.completionNotes}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(task.dueDate), "PPP", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      {task.assignedTo && (
                        <div>Asignado a: {task.assignedTo.name}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleCompleteTask(task)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Completar
                      </Button>
                    )}
                    {task.status === "COMPLETED" && (
                      <span className="text-sm text-green-600 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1 fill-green-600" />
                        Completada
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo para notas de finalización */}
      <Dialog
        open={showCompletionNotesDialog}
        onOpenChange={setShowCompletionNotesDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completionNotes">
                Notas de finalización <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="completionNotes"
                placeholder="Describe cómo se completó la tarea o agrega notas adicionales..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompletionNotesDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCompleteTask}
              disabled={
                !completionNotes.trim() ||
                updateTaskStatusMutation.isPending ||
                updateCompletionNotesMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateTaskStatusMutation.isPending ||
              updateCompletionNotesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Completar Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
