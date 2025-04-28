"use client";

import { useState } from "react";
import {
  Star,
  Phone,
  Mail,
  CalendarClock,
  PenLine,
  MoreHorizontal,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeadWithRelations } from "@/types/lead";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LeadDocuments } from "@/components/leads/sections/lead-documents";

interface LeadDetailPageProps {
  lead: LeadWithRelations;
  onBack: () => void;
}

export function LeadDetailPage({ lead, onBack }: LeadDetailPageProps) {
  const [activeTab, setActiveTab] = useState("informacion");
  const [isFavorite, setIsFavorite] = useState(true);
  const [comments, setComments] = useState("");

  // Obtener iniciales del nombre para el avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Lead */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <Avatar className="h-14 w-14 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-lg">
            {getInitials(lead.firstName, lead.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {lead.firstName} {lead.lastName}
            </h1>
            <Star
              className={`h-5 w-5 cursor-pointer ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
              onClick={() => setIsFavorite(!isFavorite)}
            />
            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Lead #{lead.id}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lead.source?.name || "Facebook - Campaña Q4"}
            {lead.company ? ` - ${lead.company}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
          >
            <Phone className="h-4 w-4 mr-2" />
            SMS
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Asistencia
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sección principal */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-normal"
              >
                Calificado
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Asignado a: <span className="font-medium">Jorge Céspedes</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Interés:
              <Badge
                variant="outline"
                className="ml-2 font-normal bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50"
              >
                Por determinar
              </Badge>
            </div>
          </div>

          {/* Sistema de pestañas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full h-auto justify-start bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none p-0">
                <TabsTrigger
                  value="informacion"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                >
                  Información
                </TabsTrigger>
                <TabsTrigger
                  value="tareas"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                >
                  Tareas
                </TabsTrigger>
                <TabsTrigger
                  value="lineaTiempo"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                >
                  Línea de tiempo
                </TabsTrigger>
                <TabsTrigger
                  value="documentos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                >
                  Documentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="informacion" className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Teléfono
                      </p>
                      <p className="font-medium">
                        {lead.phone || "+591 75757575"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Email
                      </p>
                      <p className="font-medium">
                        {lead.email || "carlos@example.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Origen del Lead */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Origen del Lead</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Fuente
                      </p>
                      <p className="font-medium">
                        {lead.source?.name || "Facebook - Campaña Q4"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Fecha de creación
                      </p>
                      <p className="font-medium">
                        {lead.createdAt
                          ? format(
                              new Date(lead.createdAt),
                              "dd/MM/yyyy, HH:mm:ss",
                              { locale: es }
                            )
                          : "13/3/2024, 13:47:00"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comentarios Extras */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Comentarios Extras</h3>
                    <Button size="sm" variant="ghost">
                      <PenLine className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Añadir comentarios adicionales sobre este lead..."
                    className="min-h-[120px] resize-none"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Guardar comentarios
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tareas" className="p-6">
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No hay tareas pendientes para este lead.
                </div>
              </TabsContent>

              <TabsContent value="lineaTiempo" className="p-6">
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  La línea de tiempo estará disponible próximamente.
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="p-6">
                <LeadDocuments lead={lead} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="lg:w-[350px] space-y-4">
          {/* Proceso de venta */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-6">Proceso de venta</h3>

              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-blue-600 text-white w-7 h-7 flex items-center justify-center text-sm">
                    1
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Crear cotización
                  </span>
                </div>

                <div className="border-l-2 border-gray-200 dark:border-gray-700 h-5 ml-3.5"></div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 w-7 h-7 flex items-center justify-center text-sm">
                    2
                  </div>
                  <span className="text-gray-400 dark:text-gray-500">
                    Registrar reserva
                  </span>
                </div>

                <div className="border-l-2 border-gray-200 dark:border-gray-700 h-5 ml-3.5"></div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 w-7 h-7 flex items-center justify-center text-sm">
                    3
                  </div>
                  <span className="text-gray-400 dark:text-gray-500">
                    Registrar venta
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-0">
              <Button
                className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                variant="ghost"
              >
                <Phone className="mr-3 h-5 w-5" />
                Llamar
              </Button>

              <Button
                className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                variant="ghost"
              >
                <CalendarClock className="mr-3 h-5 w-5" />
                Agendar cita
              </Button>

              <Button
                className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700 text-yellow-500"
                variant="ghost"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Star className="mr-3 h-5 w-5" />
                {isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
              </Button>

              <Button
                className="w-full justify-start rounded-none py-3 h-auto font-normal text-base"
                variant="ghost"
              >
                <MoreHorizontal className="mr-3 h-5 w-5" />
                Más acciones
              </Button>
            </CardContent>
          </Card>

          {/* Estado actual */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Estado actual</h3>
              <Badge className="font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50">
                Lead calificado
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
