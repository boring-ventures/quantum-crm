"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, Calendar, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LeadWithRelations } from "@/types/lead";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DuplicateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateLeads: LeadWithRelations[];
  onConfirm: () => void;
  onCancel: () => void;
  onUseClosedLeadData?: (lead: LeadWithRelations) => void;
  isLoading?: boolean;
}

export function DuplicateConfirmationDialog({
  open,
  onOpenChange,
  duplicateLeads,
  onConfirm,
  onCancel,
  onUseClosedLeadData,
  isLoading = false,
}: DuplicateConfirmationDialogProps) {
  if (!duplicateLeads || duplicateLeads.length === 0) {
    return null;
  }

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleUseClosedLeadData = (lead: LeadWithRelations) => {
    if (onUseClosedLeadData) {
      onUseClosedLeadData(lead);
      onOpenChange(false);
    }
  };

  // Separar leads activos y cerrados
  const activeLeads = duplicateLeads.filter(lead => !lead.isClosed);
  const closedLeads = duplicateLeads.filter(lead => lead.isClosed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[95vh] bg-background border-border dark:bg-gray-900 dark:border-gray-800 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground dark:text-gray-100 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            Lead Duplicado Detectado
          </DialogTitle>
        </DialogHeader>

        <div
          className="space-y-4 mt-4 overflow-y-auto flex-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
              <strong>¿Qué deseas hacer?</strong>
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
              Puedes crear el lead de todos modos si corresponde a una persona
              diferente o cancelar para revisar la información.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-3">
              Se encontraron {duplicateLeads.length} lead
              {duplicateLeads.length > 1 ? "s" : ""} existente
              {duplicateLeads.length > 1 ? "s" : ""} con el mismo número de
              celular:
            </p>

            {/* Leads Activos */}
            {activeLeads.length > 0 && (
              <div className="mb-4">
                <h4 className="text-orange-800 dark:text-orange-200 text-sm font-semibold mb-2">
                  Leads Activos ({activeLeads.length})
                </h4>
                <div className="space-y-3">
                  {activeLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            {lead.firstName && lead.lastName
                              ? `${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`
                              : lead.firstName
                                ? lead.firstName.charAt(0)
                                : lead.lastName
                                  ? lead.lastName.charAt(0)
                                  : "NN"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {lead.firstName && lead.lastName
                                ? `${lead.firstName} ${lead.lastName}`
                                : lead.firstName
                                  ? lead.firstName
                                  : lead.lastName
                                    ? lead.lastName
                                    : "Lead sin nombre"}
                            </h3>
                            {lead.status && (
                              <Badge
                                className="text-white"
                                style={{ backgroundColor: lead.status.color }}
                              >
                                {lead.status.name}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {lead.cellphone && (
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4" />
                                {lead.cellphone}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4" />
                                {lead.email}
                              </div>
                            )}
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Asignado a: {lead.assignedTo?.name || "Sin asignar"}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Creado:{" "}
                              {format(new Date(lead.createdAt), "dd/MM/yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>

                          {lead.source && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Fuente: {lead.source.name}
                            </div>
                          )}

                          {lead.extraComments && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded p-3 mt-2 border border-gray-200 dark:border-gray-600">
                              <strong className="text-gray-800 dark:text-gray-300">
                                Comentarios:
                              </strong>{" "}
                              {lead.extraComments}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leads Cerrados */}
            {closedLeads.length > 0 && (
              <div>
                <h4 className="text-red-800 dark:text-red-200 text-sm font-semibold mb-2">
                  Leads Cerrados ({closedLeads.length})
                </h4>
                <div className="space-y-3">
                  {closedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            {lead.firstName && lead.lastName
                              ? `${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`
                              : lead.firstName
                                ? lead.firstName.charAt(0)
                                : lead.lastName
                                  ? lead.lastName.charAt(0)
                                  : "NN"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {lead.firstName && lead.lastName
                                ? `${lead.firstName} ${lead.lastName}`
                                : lead.firstName
                                  ? lead.firstName
                                  : lead.lastName
                                    ? lead.lastName
                                    : "Lead sin nombre"}
                            </h3>
                            <div className="flex items-center gap-2">
                              {lead.status && (
                                <Badge
                                  className="text-white"
                                  style={{ backgroundColor: lead.status.color }}
                                >
                                  {lead.status.name}
                                </Badge>
                              )}
                              <Badge variant="destructive" className="text-xs">
                                CERRADO
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {lead.cellphone && (
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4" />
                                {lead.cellphone}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4" />
                                {lead.email}
                              </div>
                            )}
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Asignado a: {lead.assignedTo?.name || "Sin asignar"}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Creado:{" "}
                              {format(new Date(lead.createdAt), "dd/MM/yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>

                          {lead.source && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Fuente: {lead.source.name}
                            </div>
                          )}

                          {lead.extraComments && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded p-3 mt-2 border border-gray-200 dark:border-gray-600">
                              <strong className="text-gray-800 dark:text-gray-300">
                                Comentarios:
                              </strong>{" "}
                              {lead.extraComments}
                            </div>
                          )}

                          {/* Botón para usar datos del lead cerrado */}
                          {onUseClosedLeadData && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUseClosedLeadData(lead)}
                                className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                              >
                                Usar datos de este lead cerrado
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </Button>
          {activeLeads.length > 0 && (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white"
            >
              {isLoading ? "Creando..." : "Crear de todos modos"}
            </Button>
          )}
          {activeLeads.length === 0 && closedLeads.length > 0 && (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
            >
              {isLoading ? "Creando..." : "Crear nuevo lead"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
