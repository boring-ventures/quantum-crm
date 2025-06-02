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
import { Search, Plus, Loader2, UserIcon } from "lucide-react";
import { TaskCalendar } from "./components/task-calendar";
import { TaskModal } from "./components/task-modal";
import { TaskQuickViewModal } from "./components/task-quick-view-modal";
import { Task } from "@/types/lead";
import { useUserStore } from "@/store/userStore";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TasksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);
  const { toast } = useToast();

  // Obtener el usuario actual y sus permisos
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  // Verificar permisos específicos
  const canViewTasks = hasPermission(currentUser, "tasks", "view");
  const canCreateTasks = hasPermission(currentUser, "tasks", "create");
  const canEditTasks = hasPermission(currentUser, "tasks", "edit");
  const canDeleteTasks = hasPermission(currentUser, "tasks", "delete");
  const tasksScope = getScope(currentUser, "tasks", "view");

  // Determinar si es rol administrativo y el alcance
  const isManagerRole = tasksScope === "all" || tasksScope === "team";
  const isSeller = tasksScope === "self";

  // Estado para la selección de vendedor (solo para administradores)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [showSellerSelector, setShowSellerSelector] = useState(isManagerRole);

  // Para vendedores, mostrar siempre sus propias tareas
  // Para administradores, mostrar tareas según el scope
  const assignedToId = !isManagerRole
    ? currentUser?.id
    : selectedSellerId || undefined;

  // Cargar tareas con el filtro de vendedor apropiado
  const { data: tasksData, isLoading: loadingTasks } = useTasks({
    assignedToId,
    countryId:
      tasksScope === "team" ? currentUser?.countryId || undefined : undefined,
  });

  // Si es administrador, cargar la lista de vendedores según el scope
  const { data: sellersData, isLoading: loadingSellers } = useQuery({
    queryKey: [
      "sellers",
      { countryId: currentUser?.countryId, scope: tasksScope },
    ],
    queryFn: async () => {
      if (!isManagerRole) return { users: [] };

      // Construir los parámetros de consulta según el scope
      const params = new URLSearchParams();
      params.append("active", "true");

      // Agregar filtros según el scope
      if (tasksScope === "team" && currentUser?.countryId) {
        params.append("countryId", currentUser.countryId);
      }

      const response = await fetch(`/api/users/all?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Error al obtener usuarios");
      }
      return response.json();
    },
    enabled: isManagerRole && !isLoadingCurrentUser,
  });

  // Filtrar tareas según los criterios de búsqueda y filtro
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Cuando cambian las tareas o los filtros, aplicar filtrado
  useEffect(() => {
    if (!tasksData) {
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasksData];

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
    setIsLoading(false);
  }, [tasksData, searchQuery, priorityFilter]);

  // Asegurar que el estado de showSellerSelector se mantenga correcto si cambia el rol
  useEffect(() => {
    setShowSellerSelector(isManagerRole && !selectedSellerId);
  }, [isManagerRole, selectedSellerId]);

  // Manejadores para la interfaz de usuario
  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsQuickViewModalOpen(true);
  };

  const handleTaskCreated = () => {
    toast({
      title: "Tarea creada",
      description: "La tarea se ha creado correctamente",
    });
  };

  const handleTaskUpdated = () => {
    toast({
      title: "Tarea actualizada",
      description: "La tarea se ha actualizado correctamente",
    });
  };

  const handleTaskDeleted = () => {
    toast({
      title: "Tarea eliminada",
      description: "La tarea se ha eliminado correctamente",
    });
  };

  // Manejador para seleccionar un vendedor
  const handleSelectSeller = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setShowSellerSelector(false);
  };

  // Manejador para volver a la selección de vendedores
  const handleBackToSelection = () => {
    setSelectedSellerId(null);
    setShowSellerSelector(true);
  };

  // Obtener el nombre del vendedor seleccionado
  const getSelectedSellerName = () => {
    if (!sellersData?.users || !selectedSellerId) return "Desconocido";

    const seller = sellersData.users.find((s) => s.id === selectedSellerId);
    return seller?.name || "Desconocido";
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
        {canCreateTasks && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Selector de vendedor para administradores */}
      {isManagerRole && showSellerSelector && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              Seleccione un vendedor para ver sus tareas
            </h2>
            {loadingSellers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellersData?.users && sellersData.users.length > 0 ? (
                    sellersData.users.map((seller: any) => (
                      <TableRow key={seller.id}>
                        <TableCell className="font-medium">
                          {seller.name}
                        </TableCell>
                        <TableCell>{seller.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectSeller(seller.id)}
                          >
                            Ver tareas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No hay vendedores disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mostrar información del vendedor seleccionado */}
      {isManagerRole && !showSellerSelector && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Mostrando tareas de: {getSelectedSellerName()}
            </h2>
          </div>
          <Button variant="outline" onClick={handleBackToSelection} size="sm">
            Volver a selección
          </Button>
        </div>
      )}

      {/* Mostrar el calendario solo si no estamos en modo de selección de vendedor o no somos administradores */}
      {(!isManagerRole || !showSellerSelector) && (
        <>
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
              {isLoading || loadingTasks ? (
                <div className="flex justify-center items-center min-h-[500px]">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <TaskCalendar
                  tasks={filteredTasks}
                  onTaskClick={handleOpenTask}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

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
          isManagerRole={isManagerRole}
        />
      )}
    </div>
  );
}
