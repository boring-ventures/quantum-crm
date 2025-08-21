"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Star,
  CalendarClock,
  PenLine,
  MoreHorizontal,
  Loader2,
  X,
  CheckCircle,
  LockIcon,
  MessageCircle,
  Archive,
  Trash2,
  Eye,
  ArrowRightLeft,
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
import { TaskList } from "@/components/leads/task-list";
import { LeadTimeline } from "@/components/leads/lead-timeline";
import { QuotationDialog } from "@/components/leads/sales/quotation-dialog";
import { ReservationDialog } from "@/components/leads/sales/reservation-dialog";
import { SaleDialog } from "@/components/leads/sales/sale-dialog";
import {
  useUpdateLeadMutation,
  useLeadQuotation,
  useLeadReservation,
  useLeadSale,
  useDeleteLeadMutation,
  useToggleFavoriteMutation,
  useLeadQuery,
  useLeadDocuments,
} from "@/lib/hooks";
import {
  useApproveSaleMutation,
  useRejectSaleMutation,
} from "@/lib/hooks/use-sales";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskTypeDialog } from "@/components/leads/task-type-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { ReassignLeadDialog } from "@/components/leads/reassign-lead-dialog";
import { QualifyLeadDialog } from "@/components/leads/qualify-lead-dialog";
import { QualityScoreSelector } from "@/components/leads/quality-score-selector";
import { LeadStatusSelector } from "@/components/leads/lead-status-selector";
import { CloseLeadAction } from "@/components/leads/close-lead-action";
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog";
import { QualifyLeadComponent } from "@/components/leads/qualify-lead-component";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
import { CommentList } from "@/components/leads/comments/comment-list";

interface LeadDetailPageProps {
  lead: LeadWithRelations;
  onBack: () => void;
  currentUser: any; // Reemplazar isSeller por currentUser
}

// Componente para el diálogo de confirmación de archivado
interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadWithRelations;
  onConfirm: () => void;
}

function ArchiveConfirmDialog({
  open,
  onOpenChange,
  lead,
  onConfirm,
}: ArchiveConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Validar si el texto coincide con el celular del lead
    setIsValid(confirmText === lead.cellphone);
  }, [confirmText, lead.cellphone]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background dark:bg-gray-900 border-border dark:border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground dark:text-gray-100">
            Archivar Lead
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground dark:text-gray-400">
            Esta acción archivará el lead y lo moverá a la sección de
            archivados. Los leads archivados no aparecerán en las listas
            predeterminadas.
            <br />
            <br />
            Para confirmar, ingresa el número de celular del lead:{" "}
            <span className="font-medium">{lead.cellphone}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            className="bg-input dark:bg-gray-800 dark:border-gray-700"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Ingresa el celular del lead para confirmar"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent dark:bg-gray-800 dark:border-gray-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={onConfirm}
            disabled={!isValid}
          >
            Archivar Lead
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Componente para el diálogo de confirmación de eliminación
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadWithRelations;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  lead,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Validar si el texto coincide con el celular del lead
    setIsValid(confirmText === lead.cellphone);
  }, [confirmText, lead.cellphone]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background dark:bg-gray-900 border-border dark:border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground dark:text-gray-100">
            Eliminar Lead
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground dark:text-gray-400">
            Esta acción{" "}
            <span className="font-semibold text-red-600">
              eliminará permanentemente
            </span>{" "}
            el lead y todos sus datos asociados. Esta acción no se puede
            deshacer.
            <br />
            <br />
            Para confirmar, ingresa el número de celular del lead:{" "}
            <span className="font-medium">{lead.cellphone}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            className="bg-input dark:bg-gray-800 dark:border-gray-700"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Ingresa el celular del lead para confirmar"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent dark:bg-gray-800 dark:border-gray-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            disabled={!isValid}
          >
            Eliminar Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LeadDetailPage({
  lead,
  onBack,
  currentUser,
}: LeadDetailPageProps) {
  const [activeTab, setActiveTab] = useState("informacion");
  const [isFavorite, setIsFavorite] = useState(lead.isFavorite || false);
  const [salesProcess, setSalesProcess] = useState({
    quotation: false,
    reservation: false,
    sale: false,
  });
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showQualifyDialog, setShowQualifyDialog] = useState(false);
  const [showCloseLeadDialog, setShowCloseLeadDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const updateLeadMutation = useUpdateLeadMutation();
  const deleteLeadMutation = useDeleteLeadMutation();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const approveSaleMutation = useApproveSaleMutation();
  const rejectSaleMutation = useRejectSaleMutation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: documents, isLoading: isLoadingDocuments } = useLeadDocuments(
    lead.id
  );

  // Consulta para obtener datos actualizados del lead
  const { data: updatedLeadData } = useLeadQuery(lead.id);

  // Reflejar el estado de la cotización y reserva en el proceso de venta
  const { data: leadQuotation, isLoading: isLoadingLeadQuotation } =
    useLeadQuotation(lead.id);

  // Reflejar el estado de la reserva en el proceso de venta
  const { data: leadReservation, isLoading: isLoadingLeadReservation } =
    useLeadReservation(lead.id);

  // Reflejar el estado de la venta en el proceso de venta
  const { data: leadSale, isLoading: isLoadingLeadSale } = useLeadSale(lead.id);

  // Actualizar el estado local con los datos más recientes del lead
  useEffect(() => {
    if (updatedLeadData) {
      setIsFavorite(updatedLeadData.isFavorite || false);
    }
  }, [updatedLeadData]);

  // Actualizar el estado del proceso si ya hay una cotización, reserva o venta
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

    if (leadSale) {
      setSalesProcess((prev) => ({
        ...prev,
        sale: true,
      }));
    }
  }, [leadQuotation, leadReservation, leadSale]);

  // Obtener iniciales del nombre para el avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Verificar si el lead está cerrado (solo lectura)
  const isLeadClosed = lead.isClosed || lead.isArchived;

  // Determinamos los permisos del usuario actual
  const canViewLeads = hasPermission(currentUser, "leads", "view");
  const canEditLeads =
    hasPermission(currentUser, "leads", "edit") && !isLeadClosed;

  // Para eliminar, verificar que tenga permisos, el lead no esté cerrado y NO tenga scope "self"
  const leadsScope = getScope(currentUser, "leads", "delete");
  const canDeleteLeads =
    hasPermission(currentUser, "leads", "delete") &&
    !isLeadClosed &&
    leadsScope !== "self";

  const canCreateSales =
    hasPermission(currentUser, "sales", "create") && !isLeadClosed;
  const canCreateTasks =
    hasPermission(currentUser, "tasks", "create") && !isLeadClosed;
  const canViewTasks = hasPermission(currentUser, "tasks", "view");

  // Si el usuario no tiene permiso para ver leads, no mostrar nada
  if (!canViewLeads) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Acceso denegado</h3>
          <p className="text-gray-500 mb-4">
            No tienes permisos para ver la información de este lead.
          </p>
          <Button onClick={onBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    );
  }

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

  // Manejar el cambio de favorito
  const handleToggleFavorite = async () => {
    if (!canEditLeads) return;
    try {
      await toggleFavoriteMutation.mutateAsync({
        leadId: lead.id,
        isFavorite: !isFavorite,
      });

      // Actualizar el estado local inmediatamente
      setIsFavorite(!isFavorite);

      // Invalidar las queries para asegurar que todos los componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      toast({
        title: !isFavorite
          ? "Lead marcado como favorito"
          : "Lead quitado de favoritos",
        description: !isFavorite
          ? "El lead ha sido marcado como favorito\nEl cambio se reflejará en un momento."
          : "El lead ha sido quitado de favoritos\nEl cambio se reflejará en un momento.",
      });
    } catch (error) {
      console.error("Error al actualizar el estado de favorito:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de favorito",
        variant: "destructive",
      });
    }
  };

  const handleContactLead = () => {
    if (!canEditLeads) return;
    if (lead.cellphone) {
      // Eliminar cualquier carácter no numérico del número de teléfono
      const phoneNumber = lead.cellphone.replace(/\D/g, "");
      // Abrir WhatsApp con el número de teléfono
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const handleScheduleAppointment = () => {
    if (!canCreateTasks) return;
    // Abrir el diálogo de tareas directamente en el paso 2 con el tipo "client-visit"
    setSelectedTaskType("client-visit");
    setOpenTaskDialog(true);
  };

  // Componente para mostrar los documentos
  function LeadDocumentsTab() {
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);

    if (isLoadingDocuments) {
      return <div className="p-6">Cargando documentos...</div>;
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Documentos del lead</h3>
          {canEditLeads && (
            <Button
              onClick={() => setShowDocumentUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Subir documento
            </Button>
          )}
        </div>

        {!documents || documents.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            No hay documentos subidos para este lead.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {doc.name}
                  </span>
                  {doc.size > 0 && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({(doc.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                  {doc.source && doc.source !== "document" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                      {doc.source === "quotation" && "Cotización"}
                      {doc.source === "reservation" && "Reserva"}
                      {doc.source === "sale" && "Venta"}
                    </span>
                  )}
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Ver documento
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Diálogo para subir documentos */}
        {showDocumentUpload && (
          <DocumentUploadDialog
            open={showDocumentUpload}
            onOpenChange={setShowDocumentUpload}
            leadId={lead.id}
          />
        )}
      </div>
    );
  }

  // Wrapper para acciones protegidas
  const handleAction = (action: () => void) => {
    // Ejecutar la acción directamente sin verificar calificación
    action();
  };

  // Cuando se califica el lead
  const handleQualify = (isGoodLead: boolean) => {
    setShowQualifyDialog(false);
    if (isGoodLead) {
      // Invalidar el lead para que se actualice con la nueva calificación
      queryClient.invalidateQueries({
        queryKey: ["leads", lead.id],
      });
    } else {
      onBack();
    }
  };

  // Aprobar venta
  const handleApproveSale = async () => {
    if (!leadSale || !currentUser?.id) return;

    try {
      await approveSaleMutation.mutateAsync({
        saleId: leadSale.id,
        approvedBy: currentUser.id,
      });

      toast({
        title: "Venta aprobada",
        description: "La venta ha sido aprobada correctamente",
      });
    } catch (error) {
      console.error("Error al aprobar venta:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la venta",
        variant: "destructive",
      });
    }
  };

  // Rechazar venta
  const handleRejectSale = async () => {
    if (!leadSale || !currentUser?.id || !rejectionReason.trim()) return;

    try {
      await rejectSaleMutation.mutateAsync({
        saleId: leadSale.id,
        rejectedBy: currentUser.id,
        rejectionReason: rejectionReason.trim(),
      });

      toast({
        title: "Venta rechazada",
        description: "La venta ha sido rechazada",
      });

      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error al rechazar venta:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la venta",
        variant: "destructive",
      });
    }
  };

  // Manejar click en tarea
  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
    setShowTaskDetailsDialog(true);
  };

  // Archivar el lead
  const handleArchiveLead = async () => {
    if (!canEditLeads) return;

    setIsArchiving(true);

    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: {
          isArchived: true,
        },
      });

      toast({
        title: "Lead archivado",
        description: "El lead ha sido archivado correctamente.",
      });

      // Redirigir de vuelta a la lista de leads
      onBack();
    } catch (error: any) {
      console.error("Error al archivar el lead:", error);
      toast({
        title: "Error al archivar el lead",
        description:
          error.message || "Ocurrió un error al intentar archivar el lead.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
      setShowArchiveDialog(false);
    }
  };

  // Eliminar el lead
  const handleDeleteLead = async () => {
    if (!canDeleteLeads) return;

    setIsDeleting(true);

    try {
      await deleteLeadMutation.mutateAsync(lead.id);

      toast({
        title: "Lead eliminado",
        description: "El lead ha sido eliminado permanentemente.",
      });

      // Invalidar queries para actualizar listas
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // Redirigir de vuelta a la lista de leads
      onBack();
    } catch (error: any) {
      console.error("Error al eliminar el lead:", error);
      toast({
        title: "Error al eliminar el lead",
        description:
          error.message || "Ocurrió un error al intentar eliminar el lead.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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
            {canEditLeads && (
              <Star
                className={`h-5 w-5 cursor-pointer ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                onClick={() => handleAction(handleToggleFavorite)}
              />
            )}
            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Lead #{lead.id.substring(0, 8)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lead.source?.name || "Facebook - Campaña Q4"}
          </p>
        </div>
      </div>

      {/* Banner para lead cerrado */}
      {isLeadClosed && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <LockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3" />
            <div>
              <h3 className="text-amber-800 dark:text-amber-200 font-medium">
                {lead.isClosed ? "Lead Cerrado" : "Lead Archivado"}
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Este lead está en modo de solo lectura. No se pueden realizar
                acciones de edición, creación de tareas o procesos de venta.
              </p>
            </div>
          </div>
        </div>
      )}

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
              {canEditLeads ? (
                <QualityScoreSelector
                  leadId={lead.id}
                  initialScore={lead.qualityScore}
                />
              ) : (
                <Badge
                  variant="outline"
                  className={`ml-2 font-normal ${getInterestBadgeStyle(lead.qualityScore)}`}
                >
                  {getInterestText(lead.qualityScore)}
                </Badge>
              )}
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
                {canViewTasks && !isLeadClosed && (
                  <TabsTrigger
                    value="tareas"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none rounded-none px-6 py-3"
                  >
                    Tareas
                  </TabsTrigger>
                )}
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

                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Celular
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.cellphone || "Sin registro"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Producto de interés
                      </p>
                      <p className="text-base text-gray-800 dark:text-gray-200">
                        {lead.product
                          ? typeof lead.product === "string"
                            ? lead.product
                            : "name" in lead.product
                              ? (lead.product as any).name
                              : JSON.stringify(lead.product)
                          : "Sin registro"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Origen del Lead */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
                    Origen del Lead
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-6">
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
                        Categoría de fuente
                      </p>
                      {lead.source?.category ? (
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                lead.source.category.color || "#6B7280",
                            }}
                          />
                          <p className="text-base text-gray-800 dark:text-gray-200">
                            {lead.source.category.name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-base text-gray-800 dark:text-gray-200">
                          Sin registro
                        </p>
                      )}
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

                {/* Sistema de Comentarios */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
                    Comentarios
                  </h3>
                  <CommentList
                    leadId={lead.id}
                    leadAssignedToId={lead.assignedToId || ""}
                    currentUser={currentUser}
                    extraComments={lead.extraComments}
                  />
                </div>
              </TabsContent>

              {canViewTasks && !isLeadClosed && (
                <TabsContent value="tareas" className="p-6">
                  <TaskList leadId={lead.id} currentUser={currentUser} />
                </TabsContent>
              )}

              <TabsContent value="lineaTiempo" className="p-6">
                <LeadTimeline lead={lead} isFavorite={isFavorite} />
              </TabsContent>

              <TabsContent value="documentos" className="p-0">
                <LeadDocumentsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="lg:w-[350px] space-y-4">
          {/* Mostrar componente según el estado de calificación - Solo si no está cerrado */}
          {canCreateSales &&
            !isLeadClosed &&
            lead.qualification === "NOT_QUALIFIED" && (
              <QualifyLeadComponent
                lead={lead}
                onQualify={(isGoodLead) => {
                  if (isGoodLead) {
                    // Invalidar el lead para que se actualice con la nueva calificación
                    queryClient.invalidateQueries({
                      queryKey: ["leads", lead.id],
                    });
                  } else {
                    onBack();
                  }
                }}
              />
            )}

          {/* Proceso de venta - Solo visible para usuarios con permiso de ventas, lead calificado y no cerrado */}
          {canCreateSales &&
            !isLeadClosed &&
            (lead.qualification === "GOOD_LEAD" ||
              lead.qualification === "BAD_LEAD") && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-6">Proceso de venta</h3>

                  {isLoadingLeadQuotation ||
                  isLoadingLeadReservation ||
                  isLoadingLeadSale ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() =>
                          handleAction(() => setOpenModal("quotation"))
                        }
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
                          salesProcess.quotation &&
                          handleAction(() => setOpenModal("reservation"))
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

                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            salesProcess.reservation &&
                            (!leadSale ||
                              (leadSale as any).approvalStatus ===
                                "REJECTED") &&
                            handleAction(() => setOpenModal("sale"))
                          }
                          disabled={
                            !!(
                              !salesProcess.reservation ||
                              (leadSale &&
                                (leadSale as any).approvalStatus !== "REJECTED")
                            )
                          }
                          className={`w-full flex items-center gap-3 ${
                            salesProcess.reservation &&
                            (!leadSale ||
                              leadSale.approvalStatus === "REJECTED")
                              ? "hover:bg-gray-50 dark:hover:bg-gray-800"
                              : "cursor-not-allowed"
                          } rounded-md p-2 transition-colors`}
                        >
                          {salesProcess.sale &&
                          leadSale?.approvalStatus === "APPROVED" ? (
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
                              salesProcess.sale &&
                              leadSale?.approvalStatus === "APPROVED"
                                ? "text-green-600 dark:text-green-400"
                                : salesProcess.reservation
                                  ? "text-gray-600 dark:text-gray-300"
                                  : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            Registrar venta
                          </span>
                        </button>

                        {/* Estado de aprobación de venta */}
                        {/* @ts-ignore - Tipos de Prisma actualizándose */}
                        {leadSale && (
                          <div className="ml-10 space-y-2">
                            {leadSale.approvalStatus === "PENDING" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Pendiente de aprobación
                                  </span>
                                </div>
                              </div>
                            )}

                            {leadSale.approvalStatus === "APPROVED" && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-600 dark:text-green-400">
                                  Venta aprobada
                                </span>
                              </div>
                            )}

                            {leadSale.approvalStatus === "REJECTED" && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-sm text-red-600 dark:text-red-400">
                                    Venta rechazada
                                  </span>
                                </div>
                                {leadSale.rejectionReason && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                    Motivo: {leadSale.rejectionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Acciones - Basadas en permisos */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-0">
              {canEditLeads ? (
                /* Acciones para usuarios con permisos de edición */
                <>
                  <Button
                    className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                    variant="ghost"
                    onClick={() => handleAction(handleContactLead)}
                  >
                    <MessageCircle className="mr-3 h-5 w-5" />
                    Contactar
                  </Button>

                  {canCreateTasks && (
                    <Button
                      className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                      variant="ghost"
                      onClick={() => handleAction(handleScheduleAppointment)}
                    >
                      <CalendarClock className="mr-3 h-5 w-5" />
                      Agendar cita
                    </Button>
                  )}

                  <Button
                    className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700 text-yellow-500"
                    variant="ghost"
                    onClick={() => handleAction(handleToggleFavorite)}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    {toggleFavoriteMutation.isPending ? (
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    ) : (
                      <Star className="mr-3 h-5 w-5" />
                    )}
                    {toggleFavoriteMutation.isPending
                      ? "Actualizando..."
                      : isFavorite
                        ? "Quitar de favoritos"
                        : "Marcar como favorito"}
                  </Button>

                  <Button
                    className="w-full justify-start rounded-none py-3 h-auto font-normal text-base"
                    variant="ghost"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                  >
                    <MoreHorizontal className="mr-3 h-5 w-5" />
                    Más acciones
                  </Button>

                  {showActionsMenu && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {canEditLeads && (
                        <>
                          <Button
                            className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                            variant="ghost"
                            onClick={() =>
                              handleAction(() => setShowArchiveDialog(true))
                            }
                            disabled={isArchiving}
                          >
                            {isArchiving ? (
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            ) : (
                              <Archive className="mr-3 h-5 w-5 text-gray-500" />
                            )}
                            {isArchiving ? "Archivando..." : "Archivar lead"}
                          </Button>

                          <Button
                            className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                            variant="ghost"
                            onClick={() => setShowCloseLeadDialog(true)}
                          >
                            <X className="mr-3 h-5 w-5 text-orange-500" />
                            Cerrar Lead
                          </Button>
                        </>
                      )}

                      {canDeleteLeads && (
                        <Button
                          className="w-full justify-start rounded-none py-3 h-auto font-normal text-base text-red-500"
                          variant="ghost"
                          onClick={() =>
                            handleAction(() => setShowDeleteDialog(true))
                          }
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-3 h-5 w-5" />
                          )}
                          {isDeleting ? "Eliminando..." : "Eliminar lead"}
                        </Button>
                      )}

                      {canEditLeads && (
                        <Button
                          className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b border-gray-200 dark:border-gray-700"
                          variant="ghost"
                          onClick={() =>
                            handleAction(() => setShowReassignDialog(true))
                          }
                        >
                          <ArrowRightLeft className="mr-3 h-5 w-5 text-orange-500" />
                          Reasignar lead
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Acción única para usuarios sin permisos de edición: solo ver */
                <Button
                  className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-gray-200 dark:border-gray-700"
                  variant="ghost"
                  onClick={onBack}
                >
                  <Eye className="mr-3 h-5 w-5" />
                  Solo visualización (Modo Lectura)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Estado actual - Visible para todos */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Estado actual</h3>
              {canEditLeads && !isLeadClosed ? (
                <LeadStatusSelector
                  leadId={lead.id}
                  currentStatusId={lead.statusId}
                  currentStatus={lead.status}
                />
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales para el proceso de venta - Solo para usuarios con permisos y leads no cerrados */}
      {canCreateSales && !isLeadClosed && (
        <>
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
        </>
      )}

      {canCreateTasks && !isLeadClosed && (
        <TaskTypeDialog
          open={openTaskDialog}
          onOpenChange={setOpenTaskDialog}
          leadId={lead.id}
          initialStep={selectedTaskType ? 2 : 1}
          preselectedTaskType={selectedTaskType}
        />
      )}

      {showReassignDialog && (
        <ReassignLeadDialog
          open={showReassignDialog}
          onOpenChange={setShowReassignDialog}
          leadId={lead.id}
          currentUser={currentUser}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["leads", lead.id] })
          }
          assignedToId={lead.assignedTo?.id}
        />
      )}

      {showQualifyDialog && (
        <QualifyLeadDialog
          open={showQualifyDialog}
          onOpenChange={setShowQualifyDialog}
          lead={lead}
          onQualify={handleQualify}
        />
      )}

      {/* Diálogo para cerrar lead */}
      <CloseLeadAction
        leadId={lead.id}
        open={showCloseLeadDialog}
        onClose={() => setShowCloseLeadDialog(false)}
      />

      {/* Diálogo de detalles de tarea */}
      {selectedTask && (
        <TaskDetailsDialog
          taskId={selectedTask}
          open={showTaskDetailsDialog}
          onOpenChange={() => {
            setShowTaskDetailsDialog(false);
            setSelectedTask(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Diálogo de confirmación de archivado */}
      <ArchiveConfirmDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        lead={lead}
        onConfirm={handleArchiveLead}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        lead={lead}
        onConfirm={handleDeleteLead}
      />

      {/* Diálogo de rechazo de venta */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo del rechazo</Label>
              <Textarea
                placeholder="Ingresa el motivo por el cual se rechaza la venta..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSale}
              disabled={!rejectionReason.trim() || rejectSaleMutation.isPending}
            >
              {rejectSaleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rechazando...
                </>
              ) : (
                "Rechazar Venta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
