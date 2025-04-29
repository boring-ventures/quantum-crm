"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Upload,
  Download,
  File,
  Image,
  FileSpreadsheet,
  Trash2,
  PlusCircle,
  Files,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Tipo para representar un documento
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  url: string;
}

export function LeadDocuments() {
  const [open, setOpen] = useState(false);

  // Función para obtener el icono según el tipo de archivo
  const getFileIcon = (type: string) => {
    if (type.includes("image")) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (type.includes("pdf")) {
      return <Files className="h-6 w-6 text-red-500" />;
    } else if (type.includes("spreadsheet") || type.includes("excel")) {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // Función para simular la subida de un archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Aquí iría la lógica real para subir archivos
      console.log("Archivos seleccionados:", files);
      setOpen(false);
    }
  };

  // Documentos de ejemplo (en una aplicación real, se obtendrían de la API)
  const documents: Document[] = [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documentos</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              <span>Subir documento</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir nuevo documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Arrastra y suelta archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500">
                  Archivos permitidos: PDF, DOC, XLS, JPG, PNG (Máx 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="fileUpload"
                  multiple
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById("fileUpload")?.click()}
                >
                  Seleccionar archivos
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled>
                Subir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">
            No hay documentos
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Aún no se han subido documentos para este lead
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            <span>Subir el primer documento</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.type)}
                  <div>
                    <h4 className="font-medium">{doc.name}</h4>
                    <div className="flex text-xs text-gray-500 gap-2 mt-1">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>
                        {format(doc.uploadedAt, "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
