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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import html2canvas from "html2canvas";
import type { Role } from "@/types/role";

// Hook interno para obtener roles
function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/roles");

        if (!response.ok) {
          throw new Error("Error al obtener roles");
        }

        const data = await response.json();
        setRoles(data.roles || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error desconocido"));
        console.error("Error al obtener roles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, isLoading, error };
}

// Función para generar contraseña
function generatePassword(length = 10): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // Asegurar al menos un carácter de cada tipo
  password += charset.charAt(Math.floor(Math.random() * 26)); // Mayúscula
  password += charset.charAt(26 + Math.floor(Math.random() * 26)); // Minúscula
  password += charset.charAt(52 + Math.floor(Math.random() * 10)); // Número
  password += charset.charAt(62 + Math.floor(Math.random() * 8)); // Símbolo

  // Completar con caracteres aleatorios
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Mezclar los caracteres
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

const createUserSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type UserCredentials = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

type CreateUserFormProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateUserForm({
  open,
  onClose,
  onCreated,
}: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { roles, isLoading: isLoadingRoles } = useRoles();
  const [showCredentials, setShowCredentials] = useState(false);
  const [userCredentials, setUserCredentials] =
    useState<UserCredentials | null>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const generateRandomPassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword);
  };

  const downloadAsImage = () => {
    if (!userCredentials) return;

    const credentialsCard = document.getElementById("credentials-card");
    if (credentialsCard) {
      html2canvas(credentialsCard).then((canvas) => {
        const link = document.createElement("a");
        link.download = `credenciales-${userCredentials.name.replace(/\s+/g, "-")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  const handleCloseCredentials = () => {
    setShowCredentials(false);
    setUserCredentials(null);
    onClose();
    onCreated();
  };

  async function onSubmit(data: CreateUserFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear usuario");
      }

      const result = await response.json();

      // Buscar el nombre del rol
      const roleName = roles.find((r) => r.id === data.roleId)?.name || "";

      // Guardar credenciales para mostrarlas
      setUserCredentials({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        password: data.password,
        role: roleName,
      });

      // Mostrar diálogo de credenciales
      setShowCredentials(true);

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear usuario",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <>
      <Dialog
        open={open && !showCredentials}
        onOpenChange={(val) => !val && onClose()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario. Asegúrate de asignarle un
              rol.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Contraseña"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateRandomPassword}
                        title="Generar contraseña"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
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
                      disabled={isLoadingRoles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles?.map((role) => (
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de credenciales */}
      <Dialog open={showCredentials} onOpenChange={handleCloseCredentials}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Usuario creado exitosamente</DialogTitle>
            <DialogDescription>
              Guarda esta información. La contraseña no se volverá a mostrar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Card
              id="credentials-card"
              className="border bg-card text-card-foreground"
            >
              <CardHeader className="pb-2 pt-0">
                <h3 className="text-lg font-bold text-center">
                  Credenciales de acceso
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-semibold">Nombre:</span>
                  <span>{userCredentials?.name}</span>

                  <span className="font-semibold">Email:</span>
                  <span>{userCredentials?.email}</span>

                  <span className="font-semibold">Contraseña:</span>
                  <span className="font-mono bg-accent/30 px-2 py-0.5 rounded text-accent-foreground">
                    {userCredentials?.password}
                  </span>

                  <span className="font-semibold">Rol:</span>
                  <span>{userCredentials?.role}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={downloadAsImage} className="w-full sm:w-auto">
              Descargar como imagen
            </Button>
            <Button
              onClick={handleCloseCredentials}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
