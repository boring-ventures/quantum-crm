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
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function LeadsPage() {
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importLeadsOpen, setImportLeadsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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
                  <Select defaultValue="all-interests">
                    <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Grado de interés" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                      <SelectItem value="all-interests">
                        Todos los grados
                      </SelectItem>
                      <SelectItem value="high">Alto interés</SelectItem>
                      <SelectItem value="medium">Interés medio</SelectItem>
                      <SelectItem value="low">Bajo interés</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
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
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="no-management"
                    className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                  >
                    Sin Gestión
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                  >
                    Favoritos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <LeadsList filterBadLeads={true} />
                </TabsContent>
                {/* Other tab contents would be similar */}
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
