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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Plus,
  Loader2,
  UserIcon,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  XCircle,
  PlayCircle,
  Target,
  ListTodo,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export default function TasksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Estado para mostrar todas las tareas
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Calcular showSellerSelector directamente en lugar de usar estado
  const showSellerSelector =
    isManagerRole && !selectedSellerId && !showAllTasks;

  // Para vendedores, mostrar siempre sus propias tareas
  // Para administradores, mostrar tareas según el scope
  const assignedToId = !isManagerRole
    ? currentUser?.id
    : showAllTasks
      ? undefined // Mostrar todas las tareas
      : selectedSellerId || undefined;

  // Cargar tareas con el filtro de vendedor apropiado
  const { data: tasksData, isLoading: loadingTasks } = useTasks({
    assignedToId,
    countryId:
      tasksScope === "team" && currentUser?.countryId && !showAllTasks
        ? currentUser?.countryId || undefined
        : undefined,
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

  // Calcular contadores de tareas
  const taskCounts = {
    total: tasksData?.length || 0,
    scheduled: tasksData?.filter((task) => task.scheduledFor).length || 0,
    pending: tasksData?.filter((task) => task.status === "PENDING").length || 0,
    inProgress:
      tasksData?.filter((task) => task.status === "IN_PROGRESS").length || 0,
    completed:
      tasksData?.filter((task) => task.status === "COMPLETED").length || 0,
    cancelled:
      tasksData?.filter((task) => task.status === "CANCELLED").length || 0,
  };

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

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
    setIsLoading(false);
  }, [tasksData, searchQuery, statusFilter]);

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
  };

  // Manejador para volver a la selección de vendedores
  const handleBackToSelection = () => {
    setSelectedSellerId(null);
    setShowAllTasks(false);
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Seleccione un vendedor para ver sus tareas
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowAllTasks(true)}
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver todas las tareas
              </Button>
            </div>
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

      {/* Mostrar información del vendedor seleccionado o botón para volver */}
      {isManagerRole && !showSellerSelector && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {showAllTasks
                ? "Mostrando todas las tareas del sistema"
                : `Mostrando tareas de: ${getSelectedSellerName()}`}
            </h2>
          </div>
          <div className="flex gap-2">
            {showAllTasks ? (
              <Button
                variant="outline"
                onClick={() => setShowAllTasks(false)}
                size="sm"
              >
                Volver a selección
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                size="sm"
              >
                Volver a selección
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mostrar el calendario solo si no estamos en modo de selección de vendedor o no somos administradores */}
      {(!isManagerRole || !showSellerSelector) && (
        <>
          {/* Contadores de tareas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {taskCounts.total}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Programadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {taskCounts.scheduled}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {taskCounts.pending}
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  En Progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {taskCounts.inProgress}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-blue-100">
                  {taskCounts.completed}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Canceladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {taskCounts.cancelled}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Conteo global
                </p>
              </CardContent>
            </Card>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completadas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
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
                  statusFilter={statusFilter}
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
          onDelete={handleTaskDeleted}
          onUpdate={handleTaskUpdated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
