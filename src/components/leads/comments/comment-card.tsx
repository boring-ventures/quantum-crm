"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit2, Trash2, History, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeadComment } from "@/types/comment";
import { useUpdateComment, useDeleteComment } from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { CommentHistoryDialog } from "./comment-history-dialog";

interface CommentCardProps {
  comment: LeadComment;
  leadAssignedToId: string;
  currentUser: any;
  onHistoryView?: (commentId: string) => void;
}

export function CommentCard({
  comment,
  leadAssignedToId,
  currentUser,
  onHistoryView,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const { toast } = useToast();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check permissions
  const canEditLeads = hasPermission(currentUser, "leads", "edit");
  const canDeleteLeads = hasPermission(currentUser, "leads", "delete");
  const editScope = getScope(currentUser, "leads", "edit");
  const deleteScope = getScope(currentUser, "leads", "delete");

  // Determine if user can edit this comment
  const canEdit = (() => {
    if (!canEditLeads) return false;

    switch (editScope) {
      case "all":
        return true;
      case "team":
        return leadAssignedToId === currentUser.id;
      case "self":
        return comment.user.id === currentUser.id;
      default:
        return false;
    }
  })();

  // Determine if user can delete this comment
  const canDelete = (() => {
    if (!canDeleteLeads) return false;

    switch (deleteScope) {
      case "all":
        return true;
      case "team":
        return leadAssignedToId === currentUser.id;
      case "self":
        return comment.user.id === currentUser.id;
      default:
        return false;
    }
  })();

  // Determine if user can view history
  const canViewHistory = (() => {
    switch (editScope) {
      case "all":
        return true;
      case "team":
        return leadAssignedToId === currentUser.id;
      case "self":
        return comment.user.id === currentUser.id;
      default:
        return false;
    }
  })();

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        data: { content: editContent.trim() },
      });

      setIsEditing(false);
      toast({
        title: "Comentario actualizado",
        description: "El comentario se ha actualizado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync(comment.id);
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = () => {
    setShowHistoryDialog(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        {/* Comment Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs">
                {getInitials(comment.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {comment.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {canViewHistory && comment.history.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleViewHistory}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <History className="h-4 w-4" />
              </Button>
            )}

            {canEdit && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}

            {canDelete && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                disabled={deleteCommentMutation.isPending}
              >
                {deleteCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none"
              placeholder="Escribe tu comentario..."
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateCommentMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={
                  updateCommentMutation.isPending ||
                  editContent.trim() === comment.content ||
                  editContent.trim().length === 0
                }
              >
                {updateCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {/* Edit Indicator */}
        {comment.updatedAt > comment.createdAt && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Badge variant="secondary" className="text-xs">
              Editado
            </Badge>
            <span>
              {format(new Date(comment.updatedAt), "dd/MM/yyyy HH:mm", {
                locale: es,
              })}
            </span>
          </div>
        )}
      </div>

      {/* History Dialog */}
      <CommentHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        commentId={comment.id}
        canViewHistory={canViewHistory}
      />
    </>
  );
}
