"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateLeadMutation } from "@/lib/hooks";
import { useToast } from "@/components/ui/use-toast";
import { LeadStatus } from "@/types/lead";

interface LeadStatusSelectorProps {
  leadId: string;
  currentStatusId?: string;
  currentStatus?: LeadStatus | null;
  onStatusChange?: (statusId: string) => void;
}

export function LeadStatusSelector({
  leadId,
  currentStatusId,
  currentStatus,
  onStatusChange,
}: LeadStatusSelectorProps) {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const updateLeadMutation = useUpdateLeadMutation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch("/api/lead-statuses");
        if (!response.ok) {
          throw new Error("Error al cargar los estados");
        }
        const data = await response.json();
        const activeStatuses = data.filter(
          (status: LeadStatus) => status.isActive
        );
        setStatuses(activeStatuses);
      } catch (error) {
        console.error("Error al cargar los estados del lead:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los estados del lead",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, [toast]);

  const handleSelect = async (statusId: string) => {
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: {
          statusId,
        },
      });

      if (onStatusChange) {
        onStatusChange(statusId);
      }

      const selectedStatus = statuses.find((s) => s.id === statusId);

      toast({
        title: "Estado actualizado",
        description: `El estado del lead ha sido actualizado a ${selectedStatus?.name || "nuevo estado"}`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del lead",
        variant: "destructive",
      });
    }
  };

  // Encontrar el estado actual
  const getStatusName = () => {
    if (currentStatus) return currentStatus.name;

    const status = statuses.find((s) => s.id === currentStatusId);
    return status ? status.name : "Cargando...";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading || updateLeadMutation.isPending}
          className="flex items-center gap-1 px-2 h-7"
        >
          {isLoading || updateLeadMutation.isPending ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : null}
          {getStatusName()}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.id}
            className="flex items-center justify-between"
            onClick={() => handleSelect(status.id)}
          >
            <span
              className="flex items-center"
              style={{
                color: `var(--${status.color}-9, var(--${status.color}-600))`,
              }}
            >
              {status.name}
            </span>
            {currentStatusId === status.id && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
