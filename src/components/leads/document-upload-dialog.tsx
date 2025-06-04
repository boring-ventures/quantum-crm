"use client";

import { useState } from "react";
import { useUploadDocumentMutation } from "@/lib/hooks/use-leads";
import { uploadDocument } from "@/lib/supabase/upload-document";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  leadId,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadDocumentMutation = useUploadDocumentMutation();
  const { toast } = useToast();

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !leadId) return;

    setIsUploading(true);

    try {
      // 1. Subir archivo a Supabase Storage
      const uploadResult = await uploadDocument(file, leadId);

      // 2. Registrar documento en la base de datos
      await uploadDocumentMutation.mutateAsync({
        leadId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.url,
      });

      toast({
        title: "Documento subido",
        description: "El documento se ha subido correctamente",
      });

      // Cerrar diálogo y limpiar estado
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error("Error subiendo documento:", error);
      toast({
        title: "Error al subir documento",
        description: error.message || "Ocurrió un error al subir el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background dark:bg-gray-900 border-border dark:border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-gray-100">
            Subir documento
          </DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-gray-400">
            Sube un documento relacionado con este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="file"
              className="text-sm font-medium text-foreground dark:text-gray-200"
            >
              Documento
            </Label>
            <div className="relative border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <Input
                id="file"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleFileChange([files[0]]);
                  }
                }}
              />
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {file ? file.name : "Haz clic para seleccionar un archivo"}
                </span>
                {file && (
                  <span className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-transparent dark:bg-gray-800 dark:border-gray-700"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Subir documento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
