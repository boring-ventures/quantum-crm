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
import { Badge } from "@/components/ui/badge";
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

// Datos de ejemplo para la exportación
const mockLeadsData = [
  {
    id: "1",
    nombre: "Carlos",
    apellido: "Mendoza",
    celular: "+591 75757575",
    tipoContacto: "Electrónico",
    origen: "Facebook",
    tipoNegocio: "Autos",
    fechaCreacion: "2023-04-15",
    estado: "Nuevo",
    gradoInteres: "Alto",
  },
  {
    id: "2",
    nombre: "María",
    apellido: "López",
    apellidoMaterno: "García",
    celular: "+591 76767676",
    tipoContacto: "Mensaje directo",
    origen: "WhatsApp",
    tipoNegocio: "Motos",
    fechaCreacion: "2023-04-14",
    estado: "En seguimiento",
    gradoInteres: "Medio",
  },
  // Más datos de ejemplo...
];

const exportLeadsToExcel = async (leads: any[]) => {
  // Simulación de exportación
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(leads);
    }, 1000);
  });
};

export default function LeadsPage() {
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importLeadsOpen, setImportLeadsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportLeads = async () => {
    setIsExporting(true);

    try {
      await exportLeadsToExcel(mockLeadsData);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${mockLeadsData.length} leads a Excel.`,
      });
    } catch (error) {
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
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Gestión de Leads
          </h1>
          <p className="text-gray-400">
            Administra y da seguimiento a tus leads de ventas
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Leads Management */}
          <div className="flex-1">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar leads..."
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setNewLeadOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nuevo Lead
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                  onClick={() => setImportLeadsOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                  onClick={handleExportLeads}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-4">
                <Select defaultValue="all-interests">
                  <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Grado de interés" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
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
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Leads Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-gray-800 p-1 flex flex-wrap gap-1">
                <TabsTrigger
                  value="all"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Todos
                  <Badge variant="secondary" className="bg-gray-700">
                    125
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="no-management"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Sin Gestión
                  <Badge variant="secondary" className="bg-gray-700">
                    45
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="no-tasks"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Sin Tareas
                  <Badge variant="secondary" className="bg-gray-700">
                    12
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="expired-tasks"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Tareas Vencidas
                  <Badge variant="destructive">8</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="today-tasks"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Tareas Hoy
                  <Badge className="bg-blue-500 text-white">15</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="flex gap-2 data-[state=active]:bg-gray-700"
                >
                  Favoritos
                  <Badge variant="secondary" className="bg-gray-700">
                    5
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <LeadsList />
              </TabsContent>
              {/* Other tab contents would be similar */}
            </Tabs>
          </div>

          {/* Right Column - Tasks Overview */}
          <div className="lg:w-[380px]">
            <Card className="bg-gray-900/60 border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-100">
                  Tareas Pendientes
                </h2>
                <PendingTasks />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <ImportLeadsDialog
        open={importLeadsOpen}
        onOpenChange={setImportLeadsOpen}
      />
    </div>
  );
}
