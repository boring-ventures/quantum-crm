"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Country, CountryFormValues } from "@/types/country";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
  code: z
    .string()
    .min(2, { message: "El código debe tener al menos 2 caracteres" })
    .max(3, { message: "El código no puede exceder 3 caracteres" })
    .toUpperCase(),
});

interface CountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: Country | null;
  onSubmit: (data: CountryFormValues) => Promise<void>;
}

export function CountryDialog({
  open,
  onOpenChange,
  country,
  onSubmit,
}: CountryDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const { reset, formState } = form;
  const { isSubmitting } = formState;

  // Resetear el formulario cuando cambia el país o se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      if (country) {
        reset({
          name: country.name,
          code: country.code,
        });
      } else {
        reset({
          name: "",
          code: "",
        });
      }
    }
  }, [country, open, reset]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onSubmit(values);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {country ? "Editar País" : "Crear Nuevo País"}
          </DialogTitle>
          <DialogDescription>
            {country
              ? "Modifica los datos del país seleccionado"
              : "Completa el formulario para crear un nuevo país"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Argentina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="AR" {...field} maxLength={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : country
                    ? "Actualizar"
                    : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
