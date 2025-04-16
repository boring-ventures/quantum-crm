"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Nuevo Lead</DialogTitle>
          <DialogDescription className="text-gray-400">
            Ingresa los datos del nuevo prospecto de cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-800">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
              >
                Información Personal
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
              >
                Contacto
              </TabsTrigger>
              <TabsTrigger
                value="business"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
              >
                Negocio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nombre"
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
                    Apellido
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Apellido paterno"
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherLastName" className="text-gray-300">
                    Apellido materno
                  </Label>
                  <Input
                    id="motherLastName"
                    placeholder="Apellido materno"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Teléfono fijo"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-gray-300">
                    Celular
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Celular"
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-gray-300">Tipo de contacto</Label>
                <RadioGroup
                  defaultValue="electronic"
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="electronic" id="electronic" />
                    <Label htmlFor="electronic" className="text-gray-300">
                      Electrónico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outgoing-call" id="outgoing-call" />
                    <Label htmlFor="outgoing-call" className="text-gray-300">
                      Llamado Saliente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="incoming-call" id="incoming-call" />
                    <Label htmlFor="incoming-call" className="text-gray-300">
                      Llamado Entrante
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="showroom" id="showroom" />
                    <Label htmlFor="showroom" className="text-gray-300">
                      Showroom
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="street" id="street" />
                    <Label htmlFor="street" className="text-gray-300">
                      Entrevista en calle
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="database" id="database" />
                    <Label htmlFor="database" className="text-gray-300">
                      Base de datos
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-gray-300">
                    Origen
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="website">Sitio Web</SelectItem>
                      <SelectItem value="referral">Referido</SelectItem>
                      <SelectItem value="walk-in">Visita Directa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-gray-300">Tipo de negocio</Label>
                <RadioGroup
                  defaultValue="cars"
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cars" id="cars" />
                    <Label htmlFor="cars" className="text-gray-300">
                      Autos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bicycles" id="bicycles" />
                    <Label htmlFor="bicycles" className="text-gray-300">
                      Bicicletas
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="motos-yadea" id="motos-yadea" />
                    <Label htmlFor="motos-yadea" className="text-gray-300">
                      Motos - Yadea
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="motos-supersoco"
                      id="motos-supersoco"
                    />
                    <Label htmlFor="motos-supersoco" className="text-gray-300">
                      Motos - Supersoco
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trimotos" id="trimotos" />
                    <Label htmlFor="trimotos" className="text-gray-300">
                      Trimotos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scooters" id="scooters" />
                    <Label htmlFor="scooters" className="text-gray-300">
                      Patinetas
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="product" className="text-gray-300">
                    Producto de interés
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectItem value="model-1">Modelo 1</SelectItem>
                      <SelectItem value="model-2">Modelo 2</SelectItem>
                      <SelectItem value="model-3">Modelo 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-gray-300">
                    Comentarios
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Agregar comentarios o notas importantes..."
                    className="min-h-[100px] bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Guardando..." : "Guardar lead"}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="secondary"
              className="bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              {loading ? "Guardando..." : "Guardar y crear otro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
