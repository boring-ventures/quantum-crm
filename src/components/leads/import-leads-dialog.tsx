"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileType } from "lucide-react";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: ImportLeadsDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validar que sea CSV o Excel
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: "Por favor, selecciona un archivo CSV o Excel.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor, selecciona un archivo para importar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Simulación de importación - en la implementación real se enviará al endpoint de importación
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Importación pendiente",
        description: "Esta funcionalidad será implementada próximamente.",
      });

      // Cerrar el diálogo y limpiar el estado
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error during import:", error);
      toast({
        title: "Error en la importación",
        description: "Ha ocurrido un error al importar los leads.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-100">
            Importar Leads
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <FileType className="h-10 w-10 text-gray-400 mb-4" />

              <h3 className="text-gray-200 font-medium mb-2">
                {selectedFile ? selectedFile.name : "Selecciona un archivo"}
              </h3>

              {selectedFile ? (
                <p className="text-gray-400 text-sm mb-4">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              ) : (
                <p className="text-gray-400 text-sm mb-4">
                  CSV o Excel con formato específico
                </p>
              )}

              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 px-4 rounded text-sm">
                  {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
            <h4 className="font-medium text-gray-200 mb-2">
              Requisitos del archivo:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Formato CSV o Excel (.xlsx, .xls)</li>
              <li>
                Las columnas deben incluir: nombre, apellido, email, teléfono,
                etc.
              </li>
              <li>La primera fila debe contener los nombres de las columnas</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 border-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              "Importando..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
