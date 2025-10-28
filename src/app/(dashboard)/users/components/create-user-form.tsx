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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import html2canvas from "html2canvas";
import type { Role } from "@/types/role";
import type { Country } from "@/types/country";
import PermissionEditor, {
  PermissionMap,
} from "@/components/admin/permission-editor";
import { Switch } from "@/components/ui/switch";

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

const createUserSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  roleId: z.string({ required_error: "El rol es obligatorio" }),
  countryId: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type UserCredentials = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  country?: string;
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
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [showCredentials, setShowCredentials] = useState(false);
  const [userCredentials, setUserCredentials] =
    useState<UserCredentials | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [customLabel, setCustomLabel] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<PermissionMap>({});
  const [lastRoleId, setLastRoleId] = useState<string | null>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
      countryId: "",
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

  // Cuando cambia el rol seleccionado, si hay permisos personalizados y cambia el rol, resetear custom
  useEffect(() => {
    if (
      form.watch("roleId") &&
      lastRoleId &&
      form.watch("roleId") !== lastRoleId
    ) {
      setCustomPermissions({});
      setCustomLabel(false);
    }
  }, [form.watch("roleId"), lastRoleId]);

  // Validar que al menos un permiso tenga scope distinto de false
  function hasAtLeastOnePermission(permissions: PermissionMap) {
    return Object.values(permissions).some((item) =>
      ["view", "create", "edit", "delete"].some(
        (action) => item[action] !== false && item[action] !== undefined
      )
    );
  }

  async function onSubmit(data: CreateUserFormValues) {
    setIsLoading(true);
    // Normalizar countryId si es 'none'
    const submitData: any = {
      ...data,
      countryId: data.countryId === "none" ? undefined : data.countryId,
    };
    if (customLabel) {
      if (!hasAtLeastOnePermission(customPermissions)) {
        toast({
          title: "Permisos insuficientes",
          description: "Debes asignar al menos un permiso con acceso.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      submitData.user_permissions = customPermissions;
    }
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear usuario");
      }

      const result = await response.json();

      // Buscar el nombre del rol
      const roleName = roles.find((r) => r.id === data.roleId)?.name || "";

      // Buscar el nombre del país
      const countryName = data.countryId
        ? countries.find((c) => c.id === data.countryId)?.name || ""
        : undefined;

      // Guardar credenciales para mostrarlas
      setUserCredentials({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        password: data.password,
        role: roleName,
        country: countryName,
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

  // Copiar credenciales al portapapeles
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

  return (
    <>
      <Dialog
        open={open && !showCredentials}
        onOpenChange={(val) => !val && onClose()}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario. Asegúrate de asignarle un
              rol.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 scrollbar-w-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                        value={field.value}
                        disabled={isLoadingRoles}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol">
                              {customLabel ? "Personalizado" : undefined}
                            </SelectValue>
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
                {/* FUNCIONALIDAD ORIGINAL - Comentada temporalmente para restaurar fácilmente
                {form.watch("roleId") && (
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      variant={customLabel ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPermissionDialog(true)}
                    >
                      {customLabel
                        ? "Editar permisos personalizados"
                        : "Configurar permisos personalizados"}
                    </Button>
                    <FormDescription>
                      Puedes usar los permisos predeterminados del rol o
                      personalizarlos para este usuario.
                    </FormDescription>
                  </div>
                )}
                */}
                {/* REEMPLAZO TEMPORAL - Remover este bloque para restaurar funcionalidad */}
                {form.watch("roleId") && (
                  <div className="flex flex-col gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      onClick={() => {
                        toast({
                          title: "Funcionalidad temporalmente deshabilitada",
                          description:
                            "El sistema detectó cambios peligrosos en permisos predeterminados. Esta función ha sido desactivada por seguridad hasta nueva orden.",
                          variant: "destructive",
                        });
                      }}
                      className="opacity-50 cursor-not-allowed"
                    >
                      Configurar permisos personalizados
                    </Button>
                    <FormDescription className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      La configuración de permisos personalizados está
                      temporalmente deshabilitada por razones de seguridad.
                    </FormDescription>
                  </div>
                )}
                {/* FIN REEMPLAZO TEMPORAL */}
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCountries}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            Sin país asignado
                          </SelectItem>
                          {countries?.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El país es necesario para usuarios con permisos de
                        alcance "equipo"
                      </FormDescription>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* DESHABILITADO: Dialog de permisos personalizados
      <Dialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configurar permisos personalizados</DialogTitle>
            <DialogDescription>
              Personaliza los permisos de este usuario. Puedes guardar la
              configuración o cancelar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <PermissionEditor
              permissions={
                customPermissions && Object.keys(customPermissions).length > 0
                  ? customPermissions
                  : roles.find((r) => r.id === form.watch("roleId"))
                      ?.permissions || {}
              }
              onChange={setCustomPermissions}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPermissionDialog(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!hasAtLeastOnePermission(customPermissions)) {
                  toast({
                    title: "Permisos insuficientes",
                    description:
                      "Debes asignar al menos un permiso con acceso.",
                    variant: "destructive",
                  });
                  return;
                }
                setCustomLabel(true);
                setLastRoleId(form.watch("roleId"));
                setShowPermissionDialog(false);
              }}
              type="button"
            >
              Guardar configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      */}

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
