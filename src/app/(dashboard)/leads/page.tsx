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
import { Plus, Search, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useLeadsQuery } from "@/lib/hooks";

// Forzar renderizado dinámico para evitar errores con cookies()
export const dynamic = "force-dynamic";

export default function LeadsPage() {
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importLeadsOpen, setImportLeadsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [interestFilter, setInterestFilter] = useState("all-interests");
  const { toast } = useToast();
  const { data: rawLeadsData } = useLeadsQuery();

  // Contador de leads para cada categoría
  let leadsData =
    rawLeadsData?.items?.filter(
      (lead) => lead.qualification !== "BAD_LEAD" && !lead.isArchived
    ) || [];

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
  };

  const handleExportLeads = async () => {
    setIsExporting(true);

    try {
      // La exportación se implementará más adelante
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

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Leads
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administra y da seguimiento a tus leads de ventas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setNewLeadOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

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
                      <SelectItem value="medium">Interés medio (2)</SelectItem>
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
                  />
                </TabsContent>
                <TabsContent value="no-management">
                  <LeadsList
                    filterBadLeads={true}
                    searchTerm={searchTerm}
                    filterType="no-management"
                    interestLevel={getInterestScore(interestFilter)}
                  />
                </TabsContent>
                <TabsContent value="no-tasks">
                  <LeadsList
                    filterBadLeads={true}
                    searchTerm={searchTerm}
                    filterType="no-tasks"
                    interestLevel={getInterestScore(interestFilter)}
                  />
                </TabsContent>
                <TabsContent value="overdue-tasks">
                  <LeadsList
                    filterBadLeads={true}
                    searchTerm={searchTerm}
                    filterType="overdue-tasks"
                    interestLevel={getInterestScore(interestFilter)}
                  />
                </TabsContent>
                <TabsContent value="today-tasks">
                  <LeadsList
                    filterBadLeads={true}
                    searchTerm={searchTerm}
                    filterType="today-tasks"
                    interestLevel={getInterestScore(interestFilter)}
                  />
                </TabsContent>
                <TabsContent value="favorites">
                  <LeadsList
                    filterBadLeads={true}
                    searchTerm={searchTerm}
                    filterType="favorites"
                    interestLevel={getInterestScore(interestFilter)}
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
              <PendingTasks />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <ImportLeadsDialog
        open={importLeadsOpen}
        onOpenChange={setImportLeadsOpen}
      />
    </div>
  );
}
