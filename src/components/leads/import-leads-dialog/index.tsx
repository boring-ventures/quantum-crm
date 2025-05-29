import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResults {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  created: any[];
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: ImportLeadsDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ImportResults | null>(null);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/leads/import", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error al importar el archivo");
        }

        const data = await response.json();
        setResults(data);

        toast({
          title: "Importación completada",
          description: `Se importaron ${data.successful} leads exitosamente${
            data.failed > 0 ? ` y ${data.failed} tuvieron errores` : ""
          }`,
          variant: data.failed > 0 ? "destructive" : "default",
        });
      } catch (error) {
        console.error("Error en importación:", error);
        toast({
          title: "Error en la importación",
          description: "Ocurrió un error al procesar el archivo",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(100);
      }
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/leads/import/template");
      if (!response.ok) {
        throw new Error("Error al descargar la plantilla");
      }

      // Crear un blob y descargarlo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_leads.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error descargando plantilla:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de descarga de plantilla */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descarga la plantilla y llénala con tus datos
            </p>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          {/* Área de drop */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-700"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p>Suelta el archivo aquí...</p>
            ) : (
              <p>Arrastra un archivo Excel aquí, o haz clic para seleccionar</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Solo archivos .xlsx
            </p>
          </div>

          {/* Barra de progreso */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-gray-500">
                Procesando archivo...
              </p>
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {results.successful}
                  </p>
                  <p className="text-sm text-gray-500">Exitosos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {results.failed}
                  </p>
                  <p className="text-sm text-gray-500">Fallidos</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mt-2 max-h-40 overflow-auto">
                      {results.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-sm mb-1"
                        >{`Fila ${error.row}: ${error.error}`}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
