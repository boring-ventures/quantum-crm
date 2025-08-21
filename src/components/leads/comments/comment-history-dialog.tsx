"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCommentHistory } from "@/lib/hooks";
import { CommentHistory } from "@/types/comment";

interface CommentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
  canViewHistory: boolean;
}

export function CommentHistoryDialog({
  open,
  onOpenChange,
  commentId,
  canViewHistory,
}: CommentHistoryDialogProps) {
  const { data: history, isLoading, error } = useCommentHistory(commentId);

  if (!canViewHistory) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Historial de Ediciones</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Cargando historial...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">
                Error al cargar el historial
              </p>
            </div>
          )}

          {!isLoading && !error && history && history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No hay historial de ediciones para este comentario
              </p>
            </div>
          )}

          {!isLoading && !error && history && history.length > 0 && (
            <div className="space-y-4">
              {history.map((entry: CommentHistory, index: number) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <Badge variant="outline" className="text-xs">
                        {entry.action === "edited" ? "Editado" : entry.action}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{entry.editedBy.name}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Content Changes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Versión Anterior
                      </h4>
                      <div className="bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {entry.previousValue}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nueva Versión
                      </h4>
                      <div className="bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {entry.newValue}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change Summary */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Cambios realizados por{" "}
                        <span className="font-medium">
                          {entry.editedBy.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
