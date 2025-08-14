"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import {
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/lib/hooks";
import { Task } from "@/types/lead";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskCreated?: () => void;
  onTaskUpdated?: () => void;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  onTaskCreated,
  onTaskUpdated,
}: TaskModalProps) {
  // Estado para almacenar datos del formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [priority, setPriority] = useState("medium");
  const [leadId, setLeadId] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadResults, setLeadResults] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskStatusMutation();

  // Si estamos editando, llenar los campos con los datos de la tarea
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");

      if (task.scheduledFor) {
        setSelectedDate(new Date(task.scheduledFor));

        // Formatear la hora
        const time = new Date(task.scheduledFor);
        const hours = time.getHours().toString().padStart(2, "0");
        const minutes = time.getMinutes().toString().padStart(2, "0");
        setSelectedTime(`${hours}:${minutes}`);
      }

      // En el futuro, cuando agreguemos prioridad:
      // setPriority(task.priority || "medium");

      setLeadId(task.leadId);

      // Consultar información del lead
      fetchLeadById(task.leadId);
    } else {
      // Resetear el formulario
      resetForm();
    }
  }, [task, open]);

  // Resetear formulario
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedDate(undefined);
    setSelectedTime("12:00");
    setPriority("medium");
    setLeadId("");
    setLeadQuery("");
    setLeadResults([]);
    setSelectedLead(null);
  };

  // Buscar leads al escribir en el campo
  useEffect(() => {
    if (leadQuery.length < 2) {
      setLeadResults([]);
      return;
    }

    const searchTimeout = setTimeout(() => {
      searchLeads(leadQuery);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [leadQuery]);

  // Buscar leads
  const searchLeads = async (query: string) => {
    if (query.length < 2) return;

    setIsLoadingLeads(true);
    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/leads/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Error buscando leads");
      }

      const data = await response.json();
      setLeadResults(data);
    } catch (error) {
      console.error("Error buscando leads:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los leads",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Buscar lead por ID
  const fetchLeadById = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`);

      if (!response.ok) {
        throw new Error("Error cargando lead");
      }

      const data = await response.json();
      setSelectedLead(data);
    } catch (error) {
      console.error("Error cargando lead:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del lead",
        variant: "destructive",
      });
    }
  };

  // Seleccionar un lead de los resultados
  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead);
    setLeadId(lead.id);
    setLeadResults([]);
    setLeadQuery("");
    setIsSearching(false);
  };

  // Validar formulario
  const validateForm = () => {
    if (!title) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return false;
    }

    if (!leadId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un lead",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Construir fecha completa a partir de fecha y hora
  const buildDateTime = () => {
    if (!selectedDate) return undefined;

    const dateTime = new Date(selectedDate);

    // Aplicar la hora seleccionada
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      dateTime.setHours(hours, minutes);
    }

    return dateTime;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return;

    const scheduledFor = buildDateTime();

    try {
      if (task) {
        // Aquí iría la lógica para actualizar una tarea existente
        // Por ahora, solo actualizamos el estado
        await updateTaskMutation.mutateAsync({
          taskId: task.id,
          leadId: task.leadId,
          status: task.status,
        });

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });

        if (onTaskUpdated) onTaskUpdated();
      } else {
        // Crear nueva tarea
        await createTaskMutation.mutateAsync({
          title,
          leadId,
          assignedToId: user.id,
          description: description || undefined,
          scheduledFor,
        });

        toast({
          title: "Tarea creada",
          description: "La tarea se ha creado correctamente",
        });

        if (onTaskCreated) onTaskCreated();
      }

      // Cerrar modal y resetear formulario
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error guardando tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? "Editar Tarea" : "Crear Nueva Tarea"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="md:text-right">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-3"
              placeholder="Título de la tarea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
            <Label htmlFor="lead" className="md:text-right pt-2">
              Lead
            </Label>
            <div className="md:col-span-3 relative">
              {selectedLead ? (
                <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 bg-background">
                  <span>
                    {selectedLead.firstName} {selectedLead.lastName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(null);
                      setLeadId("");
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="lead"
                    value={leadQuery}
                    onChange={(e) => setLeadQuery(e.target.value)}
                    placeholder="Buscar lead por nombre o email"
                    onFocus={() => setIsSearching(true)}
                  />
                  {isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-md z-10 max-h-[200px] overflow-y-auto">
                      {isLoadingLeads ? (
                        <div className="flex justify-center items-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : leadResults.length > 0 ? (
                        <div className="p-2">
                          {leadResults.map((lead) => (
                            <div
                              key={lead.id}
                              className="hover:bg-accent rounded-md px-2 py-1.5 cursor-pointer"
                              onClick={() => handleSelectLead(lead)}
                            >
                              {lead.firstName} {lead.lastName}
                              {lead.email && (
                                <span className="text-xs block text-muted-foreground">
                                  {lead.email}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : leadQuery.length >= 2 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No se encontraron leads
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Escribe al menos 2 caracteres
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="md:text-right">
              Fecha
            </Label>
            <div className="md:col-span-3 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full sm:w-[140px]">
                <div className="flex w-full items-center rounded-md border border-input px-3 bg-background">
                  <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="md:text-right">
              Prioridad
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="md:col-span-3">
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="md:text-right pt-2">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="md:col-span-3"
              placeholder="Descripción opcional"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {(createTaskMutation.isPending || updateTaskMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {task ? "Actualizar" : "Crear"} Tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
