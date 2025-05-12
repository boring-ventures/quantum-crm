"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Pencil, Trash2, Loader2 } from "lucide-react";

interface Specification {
  feature: string;
  value: string;
}

interface SpecificationsTabProps {
  formData: any;
  updateFormData: (data: any) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  isSubmitting: boolean;
}

export function SpecificationsTab({
  formData,
  updateFormData,
  goToNextTab,
  goToPreviousTab,
  isSubmitting,
}: SpecificationsTabProps) {
  const [specifications, setSpecifications] = useState<Specification[]>(
    formData.specifications || []
  );
  const [currentSpec, setCurrentSpec] = useState<Specification>({
    feature: "",
    value: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Actualizar formData cuando cambian las especificaciones
  const updateSpecifications = (newSpecs: Specification[]) => {
    setSpecifications(newSpecs);
    updateFormData({ specifications: newSpecs });
  };

  // Agregar nueva especificación
  const handleAddSpecification = () => {
    // Validar que ambos campos estén completos
    if (!currentSpec.feature.trim() || !currentSpec.value.trim()) {
      return;
    }

    if (editIndex !== null) {
      // Estamos editando una especificación existente
      const updatedSpecs = [...specifications];
      updatedSpecs[editIndex] = { ...currentSpec };
      updateSpecifications(updatedSpecs);
      setEditIndex(null);
    } else {
      // Estamos agregando una nueva especificación
      updateSpecifications([...specifications, { ...currentSpec }]);
    }

    // Limpiar el formulario
    setCurrentSpec({ feature: "", value: "" });
  };

  // Editar una especificación existente
  const handleEditSpecification = (index: number) => {
    setCurrentSpec(specifications[index]);
    setEditIndex(index);
  };

  // Eliminar una especificación
  const handleDeleteSpecification = (index: number) => {
    const updatedSpecs = specifications.filter((_, i) => i !== index);
    updateSpecifications(updatedSpecs);
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSpec((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="feature">Característica</Label>
              <Input
                id="feature"
                name="feature"
                value={currentSpec.feature}
                onChange={handleInputChange}
                placeholder="Nombre de la característica"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                name="value"
                value={currentSpec.value}
                onChange={handleInputChange}
                placeholder="Valor de la característica"
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddSpecification}
              disabled={
                isSubmitting ||
                !currentSpec.feature.trim() ||
                !currentSpec.value.trim()
              }
              className="mt-2"
            >
              {editIndex !== null ? (
                "Actualizar"
              ) : (
                <>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Agregar
                </>
              )}
            </Button>
          </div>

          {specifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Característica</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specifications.map((spec, index) => (
                  <TableRow key={index}>
                    <TableCell>{spec.feature}</TableCell>
                    <TableCell>{spec.value}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSpecification(index)}
                          disabled={isSubmitting}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSpecification(index)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No hay especificaciones agregadas.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={goToPreviousTab}
          disabled={isSubmitting}
        >
          Anterior
        </Button>
        <Button onClick={goToNextTab} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Siguiente"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
