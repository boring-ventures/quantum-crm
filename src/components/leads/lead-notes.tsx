"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadNotes, useCreateNoteMutation } from "@/lib/hooks/use-leads";

interface LeadNotesProps {
  leadId: string;
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const { data: notes, isLoading } = useLeadNotes(leadId);
  const createNoteMutation = useCreateNoteMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        leadId,
        content: content.trim(),
        isPinned,
      });

      setContent("");
      setIsPinned(false);
    } catch (error) {
      console.error("Error al crear nota:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Nueva nota</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Escribe una nota..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-primary"
                />
                <span className="text-sm">Fijar esta nota</span>
              </label>
              <Button
                type="submit"
                disabled={!content.trim() || createNoteMutation.isPending}
              >
                Guardar nota
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Cargando notas...</div>
        ) : notes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay notas para este lead
          </div>
        ) : (
          notes?.map((note: any) => (
            <Card key={note.id} className={isPinned ? "border-primary/50" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {note.createdBy?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {note.createdBy?.name || "Usuario"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), "PPp", { locale: es })}
                    </span>
                  </div>
                  {note.isPinned && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Fijado
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap mt-2">{note.content}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
