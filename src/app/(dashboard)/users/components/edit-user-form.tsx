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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";
import type { Country } from "@/types/country";
import { hasPermission } from "@/lib/utils/permissions";

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

// Hook para obtener países
function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/countries");

        if (!response.ok) {
          throw new Error("Error al obtener países");
        }

        const data = await response.json();
        setCountries(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error desconocido"));
        console.error("Error al obtener países:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, isLoading, error };
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

const editUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .optional(),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
  countryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

type UserCredentials = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  country?: string;
};

type EditUserFormProps = {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  user: User;
};

export function EditUserForm({
  open,
  onClose,
  onUpdated,
  user,
}: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { roles, isLoading: isLoadingRoles } = useRoles();
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [userCredentials, setUserCredentials] =
    useState<UserCredentials | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Obtener usuario actual para permisos
  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user || null));
  }, []);

  // Setear valores iniciales de rol y país correctamente
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId || "",
      countryId: user.countryId || "none",
      isActive: user.isActive,
    },
  });

  // Si roles ya están cargados y el valor es vacío, setear el primero
  useEffect(() => {
    if (!form.getValues("roleId") && roles.length > 0) {
      form.setValue("roleId", roles[0].id);
    }
  }, [roles]);

  // Si countryId es vacío, setear a 'none'
  useEffect(() => {
    if (!form.getValues("countryId")) {
      form.setValue("countryId", "none");
    }
  }, [countries]);

  const generateRandomPassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword);
  };

  async function onSubmit(data: EditUserFormValues) {
    setIsLoading(true);
    try {
      // Normalizar countryId
      const submitData: any = { ...data };
      if (submitData.countryId === "none") submitData.countryId = undefined;
      // Si no se está cambiando la contraseña y el campo password existe pero está vacío, lo eliminamos
      if (!isResetPassword && submitData.password === "") {
        delete submitData.password;
      }
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar usuario");
      }
      const result = await response.json();
      // Si se actualizó la contraseña, mostrar credenciales
      if (isResetPassword && submitData.password) {
        const roleName =
          roles.find((r) => r.id === submitData.roleId)?.name || "";
        const countryName = submitData.countryId
          ? countries.find((c) => c.id === submitData.countryId)?.name || ""
          : undefined;
        setUserCredentials({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          password: submitData.password,
          role: roleName,
          country: countryName,
        });
        setShowCredentials(true);
      } else {
        toast({
          title: "Usuario actualizado",
          description: "Usuario actualizado exitosamente",
          variant: "default",
        });
        onUpdated();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  const downloadAsImage = () => {
    if (!userCredentials) return;

    const credentialsCard = document.getElementById("credentials-card");
    if (credentialsCard) {
      // Usar html2canvas
      import("html2canvas")
        .then(({ default: html2canvas }) => {
          html2canvas(credentialsCard).then((canvas) => {
            const link = document.createElement("a");
            link.download = `credenciales-${userCredentials.name.replace(/\s+/g, "-")}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          });
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: "No se pudo generar la imagen.",
            variant: "destructive",
          });
        });
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!userCredentials) return;
    let text = `Nombre: ${userCredentials.name}\nEmail: ${userCredentials.email}\nContraseña: ${userCredentials.password}\nRol: ${userCredentials.role}`;
    if (userCredentials.country) text += `\nPaís: ${userCredentials.country}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Credenciales copiadas al portapapeles",
    });
  };

  const handleCloseCredentials = () => {
    setShowCredentials(false);
    setUserCredentials(null);
    onClose();
    onUpdated();
  };

  return (
    <>
      <Dialog
        open={open && !showCredentials}
        onOpenChange={(val) => !val && onClose()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Si deseas cambiar la contraseña,
              activa la opción correspondiente.
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
              <div className="flex items-center space-x-2 py-2">
                <Switch
                  id="reset-password"
                  checked={isResetPassword}
                  onCheckedChange={setIsResetPassword}
                />
                <label
                  htmlFor="reset-password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Restablecer contraseña
                </label>
              </div>
              {isResetPassword && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Contraseña"
                            type="text"
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generateRandomPassword}
                          title="Generar contraseña"
                          className="h-10 w-10"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingCountries}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin país asignado</SelectItem>
                        {countries?.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      El país es necesario para usuarios con permisos de alcance
                      "equipo"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Estado activo</FormLabel>
                      <FormDescription className="text-xs">
                        Desactiva esta opción para impedir que el usuario acceda
                        al sistema
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                {hasPermission(currentUser, "users", "edit") && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Actualizando..." : "Actualizar usuario"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de credenciales */}
      <Dialog open={showCredentials} onOpenChange={handleCloseCredentials}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contraseña restablecida</DialogTitle>
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
                  Credenciales actualizadas
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

                  {userCredentials?.country && (
                    <>
                      <span className="font-semibold">País:</span>
                      <span>{userCredentials.country}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={downloadAsImage} className="w-full sm:w-auto">
              Descargar como imagen
            </Button>
            <Button
              onClick={copyCredentialsToClipboard}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Copiar credenciales
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
