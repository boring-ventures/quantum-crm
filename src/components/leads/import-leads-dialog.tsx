"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: ImportLeadsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    invalid: number;
    errors: Array<{ row: number; field: string; message: string }>;
  }>({ valid: 0, invalid: 0, errors: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Verificar que sea un archivo Excel
      if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls") ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        setUploadStatus("idle");
        // Simular validación
        simulateValidation(selectedFile);
      } else {
        alert(
          "Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)"
        );
        e.target.value = "";
      }
    }
  };

  const simulateValidation = (file: File) => {
    // Simulación de validación del archivo
    setTimeout(() => {
      // Ejemplo de resultados de validación
      setValidationResults({
        valid: 42,
        invalid: 3,
        errors: [
          { row: 5, field: "Email", message: "Formato de email inválido" },
          {
            row: 12,
            field: "Teléfono",
            message: "Número de teléfono incompleto",
          },
          { row: 18, field: "Nombre", message: "Campo requerido" },
        ],
      });
    }, 500);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    // Simulación de carga
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    // Simulación de finalización de carga
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus("success");
      setUploading(false);

      // Después de 2 segundos, cerrar el diálogo
      setTimeout(() => {
        handleReset();
        onOpenChange(false);
      }, 2000);
    }, 4000);
  };

  const handleReset = () => {
    setFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setValidationResults({ valid: 0, invalid: 0, errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    // En una implementación real, esto generaría y descargaría una plantilla Excel
    console.log("Descargando plantilla...");
    // Aquí iría la lógica para generar y descargar la plantilla
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Importar Leads</DialogTitle>
          <DialogDescription className="text-gray-400">
            Importa múltiples leads desde un archivo Excel o CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
            >
              Cargar Archivo
            </TabsTrigger>
            <TabsTrigger
              value="instructions"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
            >
              Instrucciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-300">
                Archivo de importación
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla
              </Button>
            </div>

            {!file ? (
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-medium mb-1 text-gray-200">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-gray-500">
                  o arrastra y suelta aquí
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos soportados: .xlsx, .xls, .csv
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-800 border-gray-700">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-200">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="hover:bg-gray-700"
                  >
                    <XCircle className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-gray-300">Eliminar</span>
                  </Button>
                </div>

                {validationResults.valid > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        Validación del archivo
                      </span>
                      <span className="font-medium text-gray-200">
                        {validationResults.valid} válidos,{" "}
                        {validationResults.invalid} con errores
                      </span>
                    </div>

                    {validationResults.invalid > 0 && (
                      <Alert
                        variant="destructive"
                        className="bg-red-900/30 border-red-800 text-red-200"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errores de validación</AlertTitle>
                        <AlertDescription>
                          <ul className="text-xs mt-2 space-y-1">
                            {validationResults.errors.map((error, index) => (
                              <li key={index}>
                                Fila {error.row}: {error.field} -{" "}
                                {error.message}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {uploadStatus === "uploading" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Progreso</span>
                          <span className="text-gray-300">
                            {uploadProgress}%
                          </span>
                        </div>
                        <Progress
                          value={uploadProgress}
                          className="h-2 bg-gray-700"
                        />
                      </div>
                    )}

                    {uploadStatus === "success" && (
                      <Alert className="bg-green-900/30 border-green-800 text-green-200">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Importación exitosa</AlertTitle>
                        <AlertDescription>
                          Se han importado {validationResults.valid} leads
                          correctamente.
                        </AlertDescription>
                      </Alert>
                    )}

                    {uploadStatus === "error" && (
                      <Alert
                        variant="destructive"
                        className="bg-red-900/30 border-red-800 text-red-200"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error en la importación</AlertTitle>
                        <AlertDescription>
                          Ha ocurrido un error al procesar el archivo. Por
                          favor, inténtalo de nuevo.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-200">
                Instrucciones para importar leads
              </h3>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  1. Descarga la plantilla
                </h4>
                <p className="text-sm text-gray-400">
                  Utiliza nuestra plantilla para asegurarte de que los datos
                  están en el formato correcto.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  2. Completa la información
                </h4>
                <p className="text-sm text-gray-400">
                  Llena la plantilla con la información de tus leads. Los campos
                  obligatorios son:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-400 ml-2">
                  <li>Nombre</li>
                  <li>Apellido</li>
                  <li>Teléfono móvil</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  3. Guarda el archivo
                </h4>
                <p className="text-sm text-gray-400">
                  Guarda el archivo en formato Excel (.xlsx, .xls) o CSV (.csv).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  4. Sube el archivo
                </h4>
                <p className="text-sm text-gray-400">
                  Sube el archivo en la pestaña "Cargar Archivo" y haz clic en
                  "Importar".
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  5. Revisa los resultados
                </h4>
                <p className="text-sm text-gray-400">
                  Después de la importación, revisa los resultados para
                  asegurarte de que todos los leads se importaron correctamente.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || validationResults.invalid > 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>Importando...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar{" "}
                {validationResults.valid > 0
                  ? `${validationResults.valid} leads`
                  : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
