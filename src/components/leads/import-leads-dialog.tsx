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
import { Upload, FileType, Download, AlertCircle } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import {
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
} from "@/components/ui/dialog";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
  created: any[];
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: ImportLeadsDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const { toast } = useToast();
  const { user } = useUserStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: "Por favor, selecciona un archivo Excel (.xlsx) o CSV.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/leads/import/template");
      if (!res.ok) throw new Error("No se pudo descargar la plantilla");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_leads.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
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
    if (!user) {
      toast({
        title: "Usuario no autenticado",
        description: "Debes iniciar sesión para importar.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user", JSON.stringify(user));
      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al importar leads");
      }
      const data = await res.json();
      setResult(data);
      setShowResultModal(true);
      toast({
        title: "Importación completada",
        description: `Leads exitosos: ${data.successful}, con errores: ${data.failed}`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: "Error en la importación",
        description:
          error.message || "Ha ocurrido un error al importar los leads.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Modo claro/oscuro: usar clases condicionales
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const bgPanel = isDark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const bgBox = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-gray-100 border-gray-200";
  const textMain = isDark ? "text-gray-100" : "text-gray-900";
  const textSub = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`sm:max-w-[500px] ${bgPanel}`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-semibold ${textMain}`}>
              Importar Leads
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${bgBox}`}
            >
              <div className="flex flex-col items-center">
                <FileType className={`h-10 w-10 mb-4 ${textSub}`} />
                <h3 className={`font-medium mb-2 ${textMain}`}>
                  {selectedFile ? selectedFile.name : "Selecciona un archivo"}
                </h3>
                {selectedFile ? (
                  <p className={`text-sm mb-4 ${textSub}`}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                ) : (
                  <p className={`text-sm mb-4 ${textSub}`}>
                    Excel (.xlsx) con formato específico
                  </p>
                )}
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span
                    className={`py-2 px-4 rounded text-sm ${bgPanel} ${textMain} border ${isDark ? "border-gray-700" : "border-gray-300"} hover:bg-blue-600 hover:text-white transition`}
                  >
                    {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Upload className="animate-spin h-4 w-4" /> Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Descargar plantilla Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className={`${bgBox} rounded-lg p-4 text-sm ${textSub}`}>
              <h4 className={`font-medium mb-2 ${textMain}`}>
                Requisitos del archivo:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Formato Excel (.xlsx, .xls)</li>
                <li>
                  Las columnas deben incluir: first_name, last_name, email,
                  phone, cellphone, status_name, source_name, product_code,
                  extra_comments
                </li>
                <li>
                  La primera fila debe contener los nombres de las columnas
                </li>
                <li>
                  Puedes descargar la plantilla para ver el formato exacto
                </li>
              </ul>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Upload className="animate-spin h-5 w-5" /> Importando leads...
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setResult(null);
                onOpenChange(false);
              }}
              className={bgBox}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
      {/* Modal de resultados y errores */}
      <Modal open={showResultModal} onOpenChange={setShowResultModal}>
        <ModalContent className={`sm:max-w-[500px] ${bgPanel}`}>
          <ModalHeader>
            <ModalTitle className={`text-xl font-semibold ${textMain}`}>
              Resultado de la importación
            </ModalTitle>
          </ModalHeader>
          {result && (
            <div className={`${bgBox} rounded-lg p-4 text-sm mt-2`}>
              <div className="flex gap-4 mb-2">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.total}
                  </div>
                  <div className="text-xs">Total</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-green-600">
                    {result.successful}
                  </div>
                  <div className="text-xs">Exitosos</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-red-600">
                    {result.failed}
                  </div>
                  <div className="text-xs">Fallidos</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-red-500 font-semibold mb-1">
                    <AlertCircle className="h-4 w-4" /> Errores encontrados:
                  </div>
                  <ul className="max-h-32 overflow-auto text-xs">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="mb-1">
                        Fila {err.row}:{" "}
                        {typeof err.error === "string"
                          ? err.error
                          : JSON.stringify(err.error)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                setShowResultModal(false);
                setResult(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
