"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserStore } from "@/store/userStore";
import { getScope } from "@/lib/utils/permissions";

interface BatchReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: string[];
  onSuccess: () => void;
}

export function BatchReassignDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BatchReassignDialogProps) {
  const [assignToUserId, setAssignToUserId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useUserStore();

  // Obtener el scope de permisos para leads
  const leadsScope = getScope(currentUser, "leads", "edit");

  // Construir el parámetro de consulta según el scope
  const getUsersQueryParams = () => {
    const params = new URLSearchParams();
    params.append("active", "true");

    if (leadsScope === "team" && currentUser?.countryId) {
      // Para scope "team", filtrar por país
      params.append("countryId", currentUser.countryId);
    } else if (leadsScope === "self" && currentUser?.countryId) {
      // Para scope "self", filtrar por país y usuarios self
      params.append("countryId", currentUser.countryId);
      params.append("scope", "self");
    }

    return params.toString() ? `?${params.toString()}` : "";
  };

  // Consulta para obtener los usuarios
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", leadsScope, currentUser?.countryId],
    queryFn: async () => {
      const response = await fetch(`/api/users/all${getUsersQueryParams()}`);
      if (!response.ok) throw new Error("Error al cargar usuarios");
      return response.json();
    },
  });

  const handleSubmit = async () => {
    if (!assignToUserId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un usuario para la reasignación",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "No se puede identificar al usuario actual",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setProgress(0);
      setError(null);
      setResults(null);

      const response = await fetch("/api/leads/batch-reassign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          toUserId: assignToUserId,
          reason: reason || "Reasignación masiva",
          currentUserId: currentUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la reasignación");
      }

      const data = await response.json();
      setResults({
        success: data.success,
        failed: data.failed,
        total: data.total,
      });

      toast({
        title: "Reasignación completada",
        description: `Se han reasignado ${data.success} de ${data.total} leads`,
      });

      if (data.success > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error en reasignación masiva:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido durante la reasignación"
      );
      toast({
        title: "Error",
        description: "Ocurrió un error al reasignar los leads",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProgress(100); // Completar la barra de progreso
    }
  };

  const resetForm = () => {
    setAssignToUserId("");
    setReason("");
    setResults(null);
    setError(null);
    setProgress(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reasignación Masiva de Leads</DialogTitle>
          <DialogDescription>
            Reasigna {selectedLeads.length} leads seleccionados a otro usuario.
          </DialogDescription>
        </DialogHeader>

        {isSubmitting && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-gray-500">Procesando reasignación...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Alert variant={results.failed > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Reasignación completada</AlertTitle>
            <AlertDescription>
              <p>Total de leads: {results.total}</p>
              <p>Reasignados correctamente: {results.success}</p>
              {results.failed > 0 && <p>Fallidos: {results.failed}</p>}
            </AlertDescription>
          </Alert>
        )}

        {!results && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="assignTo"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Asignar a
              </label>
              <Select
                value={assignToUserId}
                onValueChange={setAssignToUserId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="assignTo" className="w-full">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : usersData?.users?.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No hay usuarios disponibles
                    </div>
                  ) : (
                    usersData?.users
                      ?.filter((user) => user.id !== currentUser?.id)
                      .map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reason"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Motivo de reasignación (opcional)
              </label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ingresa el motivo de la reasignación"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!assignToUserId || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Reasignar Leads"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
