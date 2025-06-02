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
import { BatchReassignDialog } from "@/components/leads/batch-reassign-dialog";
import {
  Plus,
  Search,
  Download,
  Upload,
  UserIcon,
  Info,
  Eye,
  Package,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Star,
  Archive,
  Lock,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [batchReassignOpen, setBatchReassignOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [interestFilter, setInterestFilter] = useState("all-interests");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [showAllLeads, setShowAllLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [canSelectLeads, setCanSelectLeads] = useState(false);

  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  // Verificar los permisos y scope para leads
  const canViewLeads = hasPermission(currentUser, "leads", "view");
  const canCreateLeads = hasPermission(currentUser, "leads", "create");
  const canEditLeads = hasPermission(currentUser, "leads", "edit");
  const canDeleteLeads = hasPermission(currentUser, "leads", "delete");
  const leadsScope = getScope(currentUser, "leads", "view");

  // Determinar si debe mostrar acceso denegado
  const showAccessDenied = !canViewLeads && !isLoadingCurrentUser;

  // Verificar si tiene permiso para ver leads archivados
  const canViewArchivedLeads = ["team", "all"].includes(leadsScope as string);

  // Determinamos los filtros de usuario según el scope
  let assignedToId: string | undefined = undefined;
  let countryId: string | undefined = undefined;

  if (leadsScope === "self") {
    assignedToId = currentUser?.id;
  } else if (leadsScope === "team" && currentUser?.countryId) {
    countryId = currentUser.countryId;
  }

  // Solo aplicamos el filtro por vendedor si no estamos viendo todos los leads
  if (selectedSellerId && !showAllLeads) {
    assignedToId = selectedSellerId;
  }

  // Resetear showAllLeads cuando se selecciona un vendedor específico
  useEffect(() => {
    if (selectedSellerId) {
      setShowAllLeads(false);
    }
  }, [selectedSellerId]);

  // Resetear selección de leads al cambiar filtros o tabs
  useEffect(() => {
    setSelectedLeads([]);
  }, [searchTerm, interestFilter, activeTab, selectedSellerId, showAllLeads]);

  // Consulta para obtener vendedores si tiene permiso adecuado
  const canManageTeam = ["team", "all"].includes(leadsScope as string);

  const { data: sellersData, isLoading: loadingSellers } = useQuery({
    queryKey: [
      "sellers",
      { countryId: currentUser?.countryId, scope: leadsScope },
    ],
    queryFn: async () => {
      if (!canManageTeam) return { users: [] };

      // Construir los parámetros de consulta según el scope
      const params = new URLSearchParams();
      params.append("active", "true");

      // Agregar filtros según el scope
      if (leadsScope === "team" && currentUser?.countryId) {
        params.append("countryId", currentUser.countryId);
      }

      const response = await fetch(`/api/users/all?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Error al obtener vendedores");
      }
      return response.json();
    },
    enabled: canManageTeam && !isLoadingCurrentUser,
  });

  // Obtener datos de leads con los filtros adecuados
  const { data: rawLeadsData } = useLeadsQuery({
    assignedToId,
    countryId,
    search: searchTerm,
  });

  // Procesar los leads para estadísticas (filtrando por estado según el tab activo)
  let leadsData = rawLeadsData?.items || [];

  // Función para obtener leads filtrados por estado
  const getFilteredLeads = (status: "active" | "closed" | "archived") => {
    return rawLeadsData?.items?.filter((lead) => {
      if (status === "active") return !lead.isArchived && !lead.isClosed;
      if (status === "closed") return !lead.isArchived && lead.isClosed;
      if (status === "archived") return lead.isArchived;
      return false;
    });
  };

  // Calcular conteos para cada categoría
  const leadCounts = {
    active: getFilteredLeads("active")?.length || 0,
    closed: getFilteredLeads("closed")?.length || 0,
    archived: getFilteredLeads("archived")?.length || 0,
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

  // Manejar la selección de leads para reasignación masiva
  const handleLeadSelect = (leadId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  // Manejar éxito en la reasignación masiva
  const handleReassignSuccess = () => {
    setSelectedLeads([]);
    toast({
      title: "Reasignación completada",
      description: "Los leads han sido reasignados exitosamente.",
    });
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
      <>
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
            <TableRow>
              <TableCell colSpan={4}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowAllLeads(true);
                    setSelectedSellerId(null);
                  }}
                >
                  Ver todos los leads
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>
    );
  };

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
    <div className="space-y-4 p-8">
      {showAccessDenied ? (
        <Alert variant="destructive">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para ver los leads.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {selectedSellerId
                  ? "Leads del Usuario" +
                    `: ${
                      sellersData?.users?.find(
                        (u: any) => u.id === selectedSellerId
                      )?.name
                    }`
                  : showAllLeads
                    ? "Todos los Leads"
                    : "Gestión de Leads"}
              </h2>
              <p className="text-muted-foreground">
                {selectedSellerId
                  ? "Visualiza y gestiona los leads asignados al vendedor seleccionado"
                  : showAllLeads
                    ? `Visualiza y gestiona todos los leads ${
                        leadsScope === "team" ? "de tu país" : "del sistema"
                      }`
                    : "Selecciona un vendedor para ver sus leads o visualiza todos los leads"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {canCreateLeads && (
                <>
                  <Button onClick={() => setNewLeadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Lead
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setImportLeadsOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleExportLeads}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {(selectedSellerId || showAllLeads) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedSellerId(null);
                setShowAllLeads(false);
              }}
              className="mb-4"
            >
              ← Volver a Vendedores
            </Button>
          )}

          <Card>
            <CardContent className="p-6">
              {canManageTeam && !selectedSellerId && !showAllLeads ? (
                renderSellersTable()
              ) : (
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Input
                        placeholder="Buscar leads..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="max-w-sm"
                      />
                      <Select
                        value={interestFilter}
                        onValueChange={handleInterestChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filtrar por interés" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-interests">
                            Todos los niveles
                          </SelectItem>
                          <SelectItem value="high">Alto interés</SelectItem>
                          <SelectItem value="medium">Interés medio</SelectItem>
                          <SelectItem value="low">Bajo interés</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Botón para seleccionar para reasignación masiva */}
                      {(canEditLeads || canCreateLeads) && (
                        <Button
                          variant="outline"
                          onClick={() => setCanSelectLeads(!canSelectLeads)}
                        >
                          {canSelectLeads
                            ? "Deseleccionar para ver todos"
                            : "Seleccionar para reasignación masiva"}
                        </Button>
                      )}
                    </div>

                    {/* Estado de selección y botón para reasignación masiva */}
                    {selectedLeads.length > 0 && (
                      <div className="mb-4 flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {selectedLeads.length} lead(s) seleccionado(s)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setBatchReassignOpen(true)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Reasignar seleccionados
                        </Button>
                      </div>
                    )}

                    {/* Tabs principales para estado de leads */}
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full mb-4"
                    >
                      <TabsList>
                        <TabsTrigger
                          value="active"
                          className="flex items-center"
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          Activos ({leadCounts.active})
                        </TabsTrigger>
                        <TabsTrigger
                          value="closed"
                          className="flex items-center"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Cerrados ({leadCounts.closed})
                        </TabsTrigger>
                        {canViewArchivedLeads && (
                          <TabsTrigger
                            value="archived"
                            className="flex items-center"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archivados ({leadCounts.archived})
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </Tabs>

                    {/* Subtabs para categorías de leads */}
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList>
                        <TabsTrigger value="all" className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Todos ({leadCounts.all})
                        </TabsTrigger>
                        <TabsTrigger
                          value="no-management"
                          className="flex items-center"
                        >
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Sin Gestión ({leadCounts.noManagement})
                        </TabsTrigger>
                        <TabsTrigger
                          value="tasks"
                          className="flex items-center"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Tareas de Hoy ({leadCounts.todayTasks})
                        </TabsTrigger>
                        <TabsTrigger
                          value="overdue"
                          className="flex items-center"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Vencidas ({leadCounts.overdueTasks})
                        </TabsTrigger>
                        <TabsTrigger
                          value="favorites"
                          className="flex items-center"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Favoritos ({leadCounts.favorites})
                        </TabsTrigger>
                        {leadsScope !== "self" && (
                          <TabsTrigger
                            value="my-leads"
                            className="flex items-center"
                          >
                            <UserIcon className="mr-2 h-4 w-4" />
                            Mis Leads ({leadCounts.myLeads})
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="all" className="mt-4">
                        <LeadsList
                          searchTerm={searchTerm}
                          filterType="all"
                          leadStatus={
                            activeTab as "active" | "closed" | "archived"
                          }
                          interestLevel={getInterestScore(interestFilter)}
                          assignedToId={assignedToId}
                          countryId={countryId}
                          canEdit={canEditLeads}
                          canDelete={canDeleteLeads}
                          currentUser={currentUser}
                          showSelectionColumn={canSelectLeads}
                          selectedLeads={selectedLeads}
                          onLeadSelect={handleLeadSelect}
                        />
                      </TabsContent>
                      <TabsContent value="no-management">
                        <LeadsList
                          filterBadLeads={true}
                          searchTerm={searchTerm}
                          filterType="no-management"
                          leadStatus={
                            activeTab as "active" | "closed" | "archived"
                          }
                          interestLevel={getInterestScore(interestFilter)}
                          assignedToId={assignedToId}
                          countryId={countryId}
                          canEdit={canEditLeads}
                          canDelete={canDeleteLeads}
                          currentUser={currentUser}
                          showSelectionColumn={canSelectLeads}
                          selectedLeads={selectedLeads}
                          onLeadSelect={handleLeadSelect}
                        />
                      </TabsContent>
                      <TabsContent value="tasks">
                        <LeadsList
                          filterBadLeads={true}
                          searchTerm={searchTerm}
                          filterType="today-tasks"
                          leadStatus={
                            activeTab as "active" | "closed" | "archived"
                          }
                          interestLevel={getInterestScore(interestFilter)}
                          assignedToId={assignedToId}
                          countryId={countryId}
                          canEdit={canEditLeads}
                          canDelete={canDeleteLeads}
                          currentUser={currentUser}
                          showSelectionColumn={canSelectLeads}
                          selectedLeads={selectedLeads}
                          onLeadSelect={handleLeadSelect}
                        />
                      </TabsContent>
                      <TabsContent value="overdue">
                        <LeadsList
                          filterBadLeads={true}
                          searchTerm={searchTerm}
                          filterType="overdue-tasks"
                          leadStatus={
                            activeTab as "active" | "closed" | "archived"
                          }
                          interestLevel={getInterestScore(interestFilter)}
                          assignedToId={assignedToId}
                          countryId={countryId}
                          canEdit={canEditLeads}
                          canDelete={canDeleteLeads}
                          currentUser={currentUser}
                          showSelectionColumn={canSelectLeads}
                          selectedLeads={selectedLeads}
                          onLeadSelect={handleLeadSelect}
                        />
                      </TabsContent>
                      <TabsContent value="favorites">
                        <LeadsList
                          filterBadLeads={true}
                          searchTerm={searchTerm}
                          filterType="favorites"
                          leadStatus={
                            activeTab as "active" | "closed" | "archived"
                          }
                          interestLevel={getInterestScore(interestFilter)}
                          assignedToId={assignedToId}
                          countryId={countryId}
                          canEdit={canEditLeads}
                          canDelete={canDeleteLeads}
                          currentUser={currentUser}
                          showSelectionColumn={canSelectLeads}
                          selectedLeads={selectedLeads}
                          onLeadSelect={handleLeadSelect}
                        />
                      </TabsContent>
                      {leadsScope !== "self" && (
                        <TabsContent value="my-leads">
                          <LeadsList
                            filterBadLeads={true}
                            searchTerm={searchTerm}
                            filterType="my-leads"
                            leadStatus={
                              activeTab as "active" | "closed" | "archived"
                            }
                            interestLevel={getInterestScore(interestFilter)}
                            assignedToId={currentUser?.id}
                            countryId={countryId}
                            canEdit={canEditLeads}
                            canDelete={canDeleteLeads}
                            currentUser={currentUser}
                            showSelectionColumn={canSelectLeads}
                            selectedLeads={selectedLeads}
                            onLeadSelect={handleLeadSelect}
                          />
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>

                  <div className="w-[380px] shrink-0">
                    <Card>
                      <CardContent className="p-4">
                        <h2 className="text-lg font-semibold mb-4">
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
            </CardContent>
          </Card>

          <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
          <ImportLeadsDialog
            open={importLeadsOpen}
            onOpenChange={setImportLeadsOpen}
          />
          <BatchReassignDialog
            open={batchReassignOpen}
            onOpenChange={setBatchReassignOpen}
            selectedLeads={selectedLeads}
            onSuccess={handleReassignSuccess}
          />
        </>
      )}
    </div>
  );
}
