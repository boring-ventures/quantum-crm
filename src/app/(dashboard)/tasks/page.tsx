"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Loader2 } from "lucide-react";
import { TaskCalendar } from "./components/task-calendar";
import { TaskModal } from "./components/task-modal";
import { TaskQuickViewModal } from "./components/task-quick-view-modal";
import { Task } from "@/types/lead";

export default function TasksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      // Obtener todas las tareas del usuario autenticado
      const response = await fetch("/api/tasks/user");

      if (!response.ok) {
        throw new Error("Error al cargar tareas");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filtrar por prioridad/status
    if (priorityFilter !== "all") {
      if (priorityFilter === "completed") {
        filtered = filtered.filter((task) => task.status === "COMPLETED");
      } else {
        // Aquí implementaremos la lógica para los filtros de prioridad
        // cuando agreguemos ese campo a las tareas
      }
    }

    setFilteredTasks(filtered);
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsQuickViewModalOpen(true);
  };

  const handleTaskCreated = () => {
    fetchTasks();
    toast({
      title: "Tarea creada",
      description: "La tarea se ha creado correctamente",
    });
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    toast({
      title: "Tarea actualizada",
      description: "La tarea se ha actualizado correctamente",
    });
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    toast({
      title: "Tarea eliminada",
      description: "La tarea se ha eliminado correctamente",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Calendario de Tareas
          </h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todas tus tareas programadas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendario */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <TaskCalendar tasks={filteredTasks} onTaskClick={handleOpenTask} />
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <TaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onTaskCreated={handleTaskCreated}
        task={null}
      />

      {selectedTask && (
        <TaskQuickViewModal
          open={isQuickViewModalOpen}
          onOpenChange={setIsQuickViewModalOpen}
          task={selectedTask}
          onEdit={() => {
            setIsQuickViewModalOpen(false);
            setIsCreateModalOpen(true);
          }}
          onDelete={handleTaskDeleted}
          onUpdate={handleTaskUpdated}
        />
      )}
    </div>
  );
}
