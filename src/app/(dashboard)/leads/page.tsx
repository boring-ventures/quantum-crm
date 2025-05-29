"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsList } from "@/components/leads/leads-list";
import { PendingTasks } from "@/components/leads/pending-tasks";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { Plus, Search, Download, Upload, UserIcon, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useLeadsQuery } from "@/lib/hooks";
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
import type { User } from "@/types/user";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserStore } from "@/store/userStore";

export default function LeadsPage() {
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importLeadsOpen, setImportLeadsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [interestFilter, setInterestFilter] = useState("all-interests");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  console.log("currentUser LeadsPage: ", currentUser);

  // Verificar los permisos y scope para leads
  const canViewLeads = hasPermission(currentUser, "leads", "view");
  const canCreateLeads = hasPermission(currentUser, "leads", "create");
  const canEditLeads = hasPermission(currentUser, "leads", "edit");
  const canDeleteLeads = hasPermission(currentUser, "leads", "delete");
  const leadsScope = getScope(currentUser, "leads", "view");

  // Determinar si debe mostrar acceso denegado
  const showAccessDenied = !canViewLeads && !isLoadingCurrentUser;

  // Determinamos los filtros de usuario según el scope
  let assignedToId: string | undefined = undefined;
  let countryId: string | undefined = undefined;

  if (leadsScope === "self") {
    assignedToId = currentUser?.id;
  } else if (leadsScope === "team" && currentUser?.countryId) {
    countryId = currentUser.countryId;
  }

  if (selectedSellerId) {
    assignedToId = selectedSellerId;
  }

  // Consulta para obtener vendedores si tiene permiso adecuado
  const canManageTeam = ["team", "all"].includes(leadsScope as string);

  const { data: sellersData, isLoading: loadingSellers } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      if (!canManageTeam) return { users: [] };
      const response = await fetch(`/api/users?role=Vendedor`);
      if (!response.ok) {
        throw new Error("Error al obtener vendedores");
      }
      return response.json();
    },
    enabled: canManageTeam,
  });

  // Obtener datos de leads con los filtros adecuados
  const { data: rawLeadsData } = useLeadsQuery({
    assignedToId,
    countryId,
    search: searchTerm,
  });

  // Procesar los leads para estadísticas
  let leadsData = Array.isArray(rawLeadsData?.items) ? rawLeadsData.items : [];
  leadsData = leadsData.filter(
    (lead) => lead.qualification !== "BAD_LEAD" && !lead.isArchived
  );

  const leadCounts = {
    all: leadsData?.length || 0,
    noManagement:
      leadsData?.filter(
        (lead) =>
          (!lead.quotations || lead.quotations.length === 0) &&
          (!lead.reservations || lead.reservations.length === 0) &&
          (!lead.sales || lead.sales.length === 0)
      ).length || 0,
    noTasks:
      leadsData?.filter((lead) => !lead.tasks || lead.tasks.length === 0)
        .length || 0,
    todayTasks:
      leadsData?.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;
        return lead.tasks.some((task) => {
          if (!task.scheduledFor) return false;
          const today = new Date();
          const taskDate = new Date(task.scheduledFor);
          return (
            taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear() &&
            task.status === "PENDING"
          );
        });
      }).length || 0,
    overdueTasks:
      leadsData?.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;
        return lead.tasks.some((task) => {
          if (!task.scheduledFor) return false;
          const today = new Date();
          const taskDate = new Date(task.scheduledFor);
          return taskDate < today && task.status === "PENDING";
        });
      }).length || 0,
    favorites: leadsData?.filter((lead) => lead.isFavorite).length || 0,
    myLeads:
      leadsScope !== "self" && currentUser?.id
        ? leadsData?.filter((lead) => lead.assignedToId === currentUser.id)
            .length || 0
        : 0,
  };

  const handleExportLeads = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "Exportación pendiente",
        description: "Esta funcionalidad será implementada próximamente.",
      });
    } catch (err) {
      console.error("Error exporting leads:", err);
      toast({
        title: "Error en la exportación",
        description: "Ha ocurrido un error al exportar los leads.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInterestChange = (value: string) => {
    setInterestFilter(value);
  };

  const getInterestScore = (interest: string) => {
    switch (interest) {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  // Manejar la selección de un vendedor
  const handleSelectSeller = (sellerId: string) => {
    setSelectedSellerId(sellerId);
  };

  // Renderizar la tabla de vendedores
  const renderSellersTable = () => {
    const sellers = sellersData?.users || [];

    if (loadingSellers) {
      return <div className="py-8 text-center">Cargando vendedores...</div>;
    }

    if (sellers.length === 0) {
      return (
        <div className="py-8 text-center">
          No hay vendedores disponibles. Agrega vendedores desde la sección de
          usuarios.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller: User) => (
            <TableRow
              key={seller.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSelectSeller(seller.id)}
            >
              <TableCell className="font-medium">{seller.name}</TableCell>
              <TableCell>{seller.email}</TableCell>
              <TableCell>
                <Badge
                  variant={seller.isActive ? "default" : "secondary"}
                  className={
                    seller.isActive ? "bg-green-500 hover:bg-green-600" : ""
                  }
                >
                  {seller.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Ver Leads
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Después de obtener sellersData y antes del return principal
  const selectedSeller = sellersData?.users?.find(
    (u: any) => u.id === selectedSellerId
  );

  if (showAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert className="max-w-md">
          <Info className="h-5 w-5" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a la gestión de leads.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {canManageTeam && !selectedSellerId
              ? "Gestión de Vendedores"
              : "Gestión de Leads"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {canManageTeam && !selectedSellerId
              ? "Selecciona un vendedor para ver sus leads"
              : "Administra y da seguimiento a tus leads de ventas"}
          </p>
          {/* Dentro del return, justo antes de la interfaz de leads (cuando selectedSellerId está definido) */}
          {canManageTeam && selectedSellerId && selectedSeller && (
            <div className="my-3">
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                Mostrando leads de{" "}
                <span className="font-bold">{selectedSeller.name}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {/* Mostrar el botón de crear lead solo si tiene permiso */}
          {canCreateLeads && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setNewLeadOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Lead
            </Button>
          )}
          {/* Botón para volver a la lista de vendedores */}
          {canManageTeam && selectedSellerId && (
            <Button variant="outline" onClick={() => setSelectedSellerId(null)}>
              Volver a Vendedores
            </Button>
          )}
        </div>
      </div>

      {/* Si puede gestionar equipo y no ha seleccionado vendedor, mostrar tabla de vendedores */}
      {canManageTeam && !selectedSellerId ? (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="mb-4">
              <Input
                placeholder="Buscar vendedores..."
                className="max-w-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {renderSellersTable()}
          </CardContent>
        </Card>
      ) : (
        /* Si no puede gestionar equipo o ya seleccionó un vendedor, mostrar la interfaz de leads */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Leads Management */}
          <div className="flex-1 space-y-6">
            {/* Actions Bar */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar leads..."
                      className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <div className="flex gap-2">
                    {canCreateLeads && (
                      <>
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setImportLeadsOpen(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importar
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={handleExportLeads}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {isExporting ? "Exportando..." : "Exportar"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center gap-4">
                    <Select
                      defaultValue="all-interests"
                      value={interestFilter}
                      onValueChange={handleInterestChange}
                    >
                      <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Grado de interés" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        <SelectItem value="all-interests">
                          Todos los grados
                        </SelectItem>
                        <SelectItem value="high">Alto interés (3)</SelectItem>
                        <SelectItem value="medium">
                          Interés medio (2)
                        </SelectItem>
                        <SelectItem value="low">Bajo interés (1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Tabs */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 flex flex-wrap gap-1 mb-4">
                    <TabsTrigger
                      value="all"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Todos{" "}
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                        {leadCounts.all}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="no-management"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Sin Gestión{" "}
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                        {leadCounts.noManagement}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="no-tasks"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Sin Tareas{" "}
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                        {leadCounts.noTasks}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="overdue-tasks"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Tareas Vencidas{" "}
                      <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 rounded-full text-xs">
                        {leadCounts.overdueTasks}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="today-tasks"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Tareas Hoy{" "}
                      <span className="ml-2 px-2 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-full text-xs">
                        {leadCounts.todayTasks}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="favorites"
                      className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Favoritos{" "}
                      <span className="ml-2 px-2 py-0.5 bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 rounded-full text-xs">
                        {leadCounts.favorites}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="all"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                  <TabsContent value="no-management">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="no-management"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                  <TabsContent value="no-tasks">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="no-tasks"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                  <TabsContent value="overdue-tasks">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="overdue-tasks"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                  <TabsContent value="today-tasks">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="today-tasks"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                  <TabsContent value="favorites">
                    <LeadsList
                      filterBadLeads={true}
                      searchTerm={searchTerm}
                      filterType="favorites"
                      interestLevel={getInterestScore(interestFilter)}
                      assignedToId={assignedToId}
                      countryId={countryId}
                      canEdit={canEditLeads}
                      canDelete={canDeleteLeads}
                      currentUser={currentUser}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tasks Overview */}
          <div className="lg:w-[380px]">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Tareas Pendientes
                </h2>
                <PendingTasks
                  assignedToId={assignedToId}
                  countryId={countryId}
                  currentUser={currentUser}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        preassignedUserId={selectedSellerId || undefined}
      />
      <ImportLeadsDialog
        open={importLeadsOpen}
        onOpenChange={setImportLeadsOpen}
      />
    </div>
  );
}
