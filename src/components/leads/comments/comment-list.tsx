"use client";

import { useState } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadComment } from "@/types/comment";
import { useLeadComments, useCreateComment } from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission } from "@/lib/utils/permissions";
import { CommentCard } from "./comment-card";

interface CommentListProps {
  leadId: string;
  leadAssignedToId: string;
  currentUser: any;
  extraComments?: string | null;
}

export function CommentList({
  leadId,
  leadAssignedToId,
  currentUser,
  extraComments,
}: CommentListProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, isLoading, error } = useLeadComments(leadId);
  const createCommentMutation = useCreateComment();
  const { toast } = useToast();

  const canCreateComments = hasPermission(currentUser, "leads", "edit");

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        content: newComment.trim(),
        leadId: leadId,
      });

      setNewComment("");
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se ha publicado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({
        title: "Error al publicar",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Previous Comments Section */}
      {extraComments && extraComments.trim().length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 text-lg flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Comentarios Anteriores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {extraComments}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Estos comentarios son de solo lectura y no se pueden editar
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Comment Form */}
      {canCreateComments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Agregar Comentario</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu comentario aquí..."
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar Comentario
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Comentarios ({comments?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Cargando comentarios...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">
                Error al cargar los comentarios
              </p>
            </div>
          )}

          {!isLoading && !error && (!comments || comments.length === 0) && (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay comentarios aún
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Sé el primero en comentar sobre este lead
              </p>
            </div>
          )}

          {!isLoading && !error && comments && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  leadAssignedToId={leadAssignedToId}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
