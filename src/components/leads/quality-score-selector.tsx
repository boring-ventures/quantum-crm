"use client";

import { useState } from "react";
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

interface QualityScoreProps {
  leadId: string;
  initialScore?: number;
  onScoreChange?: (score: number) => void;
}

export function QualityScoreSelector({
  leadId,
  initialScore,
  onScoreChange,
}: QualityScoreProps) {
  const [score, setScore] = useState<number | undefined>(initialScore);
  const updateLeadMutation = useUpdateLeadMutation();
  const { toast } = useToast();

  const qualityOptions = [
    { value: 3, label: "Alto" },
    { value: 2, label: "Medio" },
    { value: 1, label: "Bajo" },
  ];

  const getQualityLabel = (value?: number) => {
    return (
      qualityOptions.find((option) => option.value === value)?.label ||
      "Sin determinar"
    );
  };

  const handleSelect = async (value: number) => {
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: {
          qualityScore: value,
        },
      });

      setScore(value);

      if (onScoreChange) {
        onScoreChange(value);
      }

      toast({
        title: "Interés actualizado",
        description: `El interés del lead ha sido actualizado a ${getQualityLabel(value)}`,
      });
    } catch (error) {
      console.error("Error al actualizar el interés:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el interés del lead",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={updateLeadMutation.isPending}
          className="flex items-center gap-1 px-2 h-6"
        >
          {updateLeadMutation.isPending ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : null}
          {getQualityLabel(score)}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {qualityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="flex items-center justify-between"
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
            {score === option.value && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
