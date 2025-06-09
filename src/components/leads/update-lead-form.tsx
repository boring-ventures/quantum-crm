"use client";

import { useState } from "react";
import { useUpdateLeadMutation } from "@/lib/hooks/use-leads";
import { useLeadStatuses, useLeadSources } from "@/lib/hooks/use-lead-metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import type { LeadWithRelations } from "@/types/lead";

interface UpdateLeadFormProps {
  lead: LeadWithRelations;
  onSuccess?: () => void;
}

export function UpdateLeadForm({ lead, onSuccess }: UpdateLeadFormProps) {
  const [formData, setFormData] = useState({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email || "",
    phone: lead.phone || "",
    statusId: lead.statusId,
    sourceId: lead.sourceId,
    interest: lead.interest || "",
    comments: lead.extraComments || "",
  });

  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const updateLeadMutation = useUpdateLeadMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: formData,
      });

      toast({
        title: "Lead actualizado",
        description: "Los datos del lead se han actualizado correctamente.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al actualizar lead:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el lead. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            Nombre
          </label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">
            Apellido
          </label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="interest" className="text-sm font-medium">
            Interés
          </label>
          <Select
            value={formData.interest}
            onValueChange={(value) => handleSelectChange("interest", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el interés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alto">Alto</SelectItem>
              <SelectItem value="Medio">Medio</SelectItem>
              <SelectItem value="Bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="statusId" className="text-sm font-medium">
            Estado
          </label>
          <Select
            value={formData.statusId}
            onValueChange={(value) => handleSelectChange("statusId", value)}
            disabled={isLoadingStatuses}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent>
              {statuses?.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="sourceId" className="text-sm font-medium">
            Fuente
          </label>
          <Select
            value={formData.sourceId}
            onValueChange={(value) => handleSelectChange("sourceId", value)}
            disabled={isLoadingSources}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la fuente" />
            </SelectTrigger>
            <SelectContent>
              {sources?.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas
        </label>
        <Textarea
          id="comments"
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={updateLeadMutation.isPending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
