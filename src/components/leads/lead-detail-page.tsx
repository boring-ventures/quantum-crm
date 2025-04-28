"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Star,
  Phone,
  Mail,
  CalendarClock,
  PenLine,
  MoreHorizontal,
  Loader2,
  X,
  Plus,
  CheckCircle,
  ShoppingCart,
  ReceiptText,
  LockIcon,
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
import { TaskList } from "@/components/leads/task-list";
import { LeadTimeline } from "@/components/leads/lead-timeline";
import { QuotationDialog } from "@/components/leads/sales/quotation-dialog";
import { ReservationDialog } from "@/components/leads/sales/reservation-dialog";
import { SaleDialog } from "@/components/leads/sales/sale-dialog";
import {
  useUpdateLeadMutation,
  useLeadQuotation,
  useLeadReservation,
} from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";

interface LeadDetailPageProps {
  lead: LeadWithRelations;
  onBack: () => void;
}

export function LeadDetailPage({ lead, onBack }: LeadDetailPageProps) {
  const [activeTab, setActiveTab] = useState("informacion");
  const [isFavorite, setIsFavorite] = useState(true);
  const [comments, setComments] = useState(lead.extraComments || "");
  const [isEditing, setIsEditing] = useState(false);
  const [originalComments, setOriginalComments] = useState(
    lead.extraComments || ""
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [salesProcess, setSalesProcess] = useState({
    quotation: false,
    reservation: false,
    sale: false,
  });
  const [openModal, setOpenModal] = useState<string | null>(null);
  const updateLeadMutation = useUpdateLeadMutation();
  const { toast } = useToast();

  // Reflejar el estado de la cotización en el proceso de venta
  const { data: leadQuotation, isLoading: quotationLoading } = useLeadQuotation(
    lead.id
  );

  // Reflejar el estado de la reserva en el proceso de venta
  const { data: leadReservation, isLoading: reservationLoading } =
    useLeadReservation(lead.id);

  // Actualizar el estado del proceso si ya hay una cotización o reserva
  useEffect(() => {
    if (leadQuotation) {
      setSalesProcess((prev) => ({
        ...prev,
        quotation: true,
      }));
    }

    if (leadReservation) {
      setSalesProcess((prev) => ({
        ...prev,
        reservation: true,
      }));
    }
  }, [leadQuotation, leadReservation]);

  // Obtener iniciales del nombre para el avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Manejar la edición de comentarios
  const handleEditComments = () => {
    setIsEditing(true);
    setOriginalComments(comments);
  };

  // Manejar cambios en el textarea
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
    setHasChanges(e.target.value !== originalComments);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setComments(originalComments);
    setIsEditing(false);
    setHasChanges(false);
  };

  // Guardar comentarios
  const handleSaveComments = async () => {
    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: {
          extraComments: comments,
        },
      });

      setOriginalComments(comments);
      setIsEditing(false);
      setHasChanges(false);

      toast({
        title: "Comentarios guardados",
        description: "Los comentarios se han guardado correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los comentarios",
        variant: "destructive",
      });
    }
  };

  // Obtener color del badge para interés según qualityScore
  const getInterestBadgeStyle = (score?: number) => {
    if (!score)
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";

    switch (score) {
      case 3:
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50";
      case 2:
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50";
      case 1:
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Obtener texto del interés según qualityScore
  const getInterestText = (score?: number) => {
    if (!score) return "Sin determinar";

    switch (score) {
      case 3:
        return "Alto";
      case 2:
        return "Medio";
      case 1:
        return "Bajo";
      default:
        return "Sin determinar";
    }
  };

  // Cerrar cualquier modal abierto
  const handleCloseModal = () => {
    setOpenModal(null);
  };

  // Completar paso de cotización
  const handleCompleteQuotation = () => {
    setSalesProcess((prev) => ({
      ...prev,
      quotation: true,
    }));
    // Aquí se podría guardar el estado en el backend
  };

  // Completar paso de reserva
  const handleCompleteReservation = () => {
    setSalesProcess((prev) => ({
      ...prev,
      reservation: true,
    }));
    // Aquí se podría guardar el estado en el backend
  };

  // Completar paso de venta
  const handleCompleteSale = () => {
    setSalesProcess((prev) => ({
      ...prev,
      sale: true,
    }));
    // Aquí se podría guardar el estado en el backend
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
              Lead #{lead.id.substring(0, 8)}
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
                Asignado a:{" "}
                <span className="font-medium">
                  {lead.assignedTo?.name || "Jorge Céspedes"}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Interés:
              <Badge
                variant="outline"
                className={`ml-2 font-normal ${getInterestBadgeStyle(lead.qualityScore)}`}
              >
                {getInterestText(lead.qualityScore)}
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
                {/* <TabsTrigger
                  value="documentos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                >
                  Documentos
                </TabsTrigger> */}
              </TabsList>

              <TabsContent value="informacion" className="p-6 space-y-8">
                {/* Información Personal */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Teléfono
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.phone || "Sin registro"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Email
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.email || "Sin registro"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Origen del Lead */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
                    Origen del Lead
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Fuente
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.source?.name || "Sin registro"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Fecha de creación
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.createdAt
                          ? format(
                              new Date(lead.createdAt),
                              "dd/MM/yyyy, HH:mm:ss",
                              { locale: es }
                            )
                          : "Sin registro"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comentarios Extras */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Comentarios Extras
                    </h3>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditComments}
                      >
                        <PenLine className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Añadir comentarios adicionales sobre este lead..."
                    className="min-h-[120px] resize-none text-gray-800 dark:text-gray-200"
                    value={comments}
                    onChange={handleCommentsChange}
                    disabled={!isEditing}
                  />
                  {isEditing && (
                    <div className="flex justify-end mt-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleSaveComments}
                        disabled={!hasChanges || updateLeadMutation.isPending}
                      >
                        {updateLeadMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Guardar comentarios
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tareas" className="p-6">
                <TaskList leadId={lead.id} />
              </TabsContent>

              <TabsContent value="lineaTiempo" className="p-6">
                <LeadTimeline lead={lead} isFavorite={isFavorite} />
              </TabsContent>

              {/* <TabsContent value="documentos" className="p-6">
                <LeadDocuments lead={lead} />
              </TabsContent> */}
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
                <button
                  onClick={() => setOpenModal("quotation")}
                  className="w-full flex items-center gap-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 transition-colors"
                >
                  {salesProcess.quotation ? (
                    <div className="rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 w-7 h-7 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-blue-600 text-white w-7 h-7 flex items-center justify-center text-sm">
                      1
                    </div>
                  )}
                  <span
                    className={`${salesProcess.quotation ? "text-green-600 dark:text-green-400" : "font-medium text-gray-800 dark:text-gray-200"}`}
                  >
                    Crear cotización
                  </span>
                </button>

                <div className="border-l-2 border-gray-200 dark:border-gray-700 h-5 ml-3.5"></div>

                <button
                  onClick={() =>
                    salesProcess.quotation && setOpenModal("reservation")
                  }
                  disabled={!salesProcess.quotation}
                  className={`w-full flex items-center gap-3 mb-2 ${salesProcess.quotation ? "hover:bg-gray-50 dark:hover:bg-gray-800" : "cursor-not-allowed"} rounded-md p-2 transition-colors`}
                >
                  {salesProcess.reservation ? (
                    <div className="rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 w-7 h-7 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : salesProcess.quotation ? (
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-7 h-7 flex items-center justify-center text-sm">
                      2
                    </div>
                  ) : (
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 w-7 h-7 flex items-center justify-center text-sm">
                      <LockIcon className="h-3 w-3" />
                    </div>
                  )}
                  <span
                    className={`${
                      salesProcess.reservation
                        ? "text-green-600 dark:text-green-400"
                        : salesProcess.quotation
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    Registrar reserva
                  </span>
                </button>

                <div className="border-l-2 border-gray-200 dark:border-gray-700 h-5 ml-3.5"></div>

                <button
                  onClick={() =>
                    salesProcess.reservation && setOpenModal("sale")
                  }
                  disabled={!salesProcess.reservation}
                  className={`w-full flex items-center gap-3 ${salesProcess.reservation ? "hover:bg-gray-50 dark:hover:bg-gray-800" : "cursor-not-allowed"} rounded-md p-2 transition-colors`}
                >
                  {salesProcess.sale ? (
                    <div className="rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 w-7 h-7 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : salesProcess.reservation ? (
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-7 h-7 flex items-center justify-center text-sm">
                      3
                    </div>
                  ) : (
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 w-7 h-7 flex items-center justify-center text-sm">
                      <LockIcon className="h-3 w-3" />
                    </div>
                  )}
                  <span
                    className={`${
                      salesProcess.sale
                        ? "text-green-600 dark:text-green-400"
                        : salesProcess.reservation
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    Registrar venta
                  </span>
                </button>
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
              <Badge
                className={`font-normal px-3 py-1 ${
                  lead.status?.color === "blue"
                    ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50"
                    : lead.status?.color === "green"
                      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50"
                      : lead.status?.color === "yellow"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50"
                        : lead.status?.color === "red"
                          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                          : lead.status?.color === "purple"
                            ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50"
                            : lead.status?.color === "pink"
                              ? "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-900/50"
                              : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50"
                }`}
              >
                {lead.status?.name || "Lead calificado"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales para el proceso de venta */}
      <QuotationDialog
        open={openModal === "quotation"}
        onClose={handleCloseModal}
        leadName={`${lead.firstName} ${lead.lastName}`}
        leadId={lead.id}
        onComplete={handleCompleteQuotation}
      />

      <ReservationDialog
        open={openModal === "reservation"}
        onClose={handleCloseModal}
        leadName={`${lead.firstName} ${lead.lastName}`}
        leadId={lead.id}
        onComplete={handleCompleteReservation}
      />

      <SaleDialog
        open={openModal === "sale"}
        onClose={handleCloseModal}
        leadName={`${lead.firstName} ${lead.lastName}`}
        leadId={lead.id}
        onComplete={handleCompleteSale}
      />
    </div>
  );
}
