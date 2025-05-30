"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";
import type { Country } from "@/types/country";

const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
  countryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserGeneralFormProps {
  userId: string;
  initialData: User;
}

export function UserGeneralForm({ userId, initialData }: UserGeneralFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Configurar formulario con datos iniciales
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: userId,
      name: initialData.name || "",
      email: initialData.email || "",
      roleId: initialData.roleId || "",
      countryId: initialData.countryId || "",
      isActive:
        initialData.isActive !== undefined ? initialData.isActive : true,
    },
  });

  // Cargar roles y países
  useEffect(() => {
    async function loadFormData() {
      try {
        setIsLoadingData(true);

        // Cargar roles
        const rolesResponse = await fetch("/api/roles");
        if (!rolesResponse.ok) throw new Error("Error al cargar roles");
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);

        // Cargar países
        const countriesResponse = await fetch("/api/admin/countries");
        if (!countriesResponse.ok) throw new Error("Error al cargar países");
        const countriesData = await countriesResponse.json();
        setCountries(countriesData || []);
      } catch (error) {
        console.error("Error loading form data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del formulario",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    }

    loadFormData();
  }, []);

  // Enviar formulario
  async function onSubmit(data: UserFormValues) {
    try {
      setIsLoading(true);
      // Normalizar countryId si es 'none'
      const submitData = {
        ...data,
        countryId: data.countryId === "none" ? undefined : data.countryId,
      };
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar usuario");
      }

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario se han actualizado correctamente",
      });

      // Refrescar datos
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/users")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al listado
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="correo@ejemplo.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin país asignado</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define el alcance de los permisos a nivel de país
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario activo</FormLabel>
                    <FormDescription>
                      Desactivar impedirá el acceso al sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
