"use client";

import {
  UserCog,
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreateUserForm } from "./components/create-user-form";
import { EditUserForm } from "./components/edit-user-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import type { User } from "@/types/user";
import { hasPermission } from "@/lib/utils/permissions";

// Componente de diálogo para restablecer contraseña
function ResetPasswordDialog({ open, onClose, user, onSuccess }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  // Función para generar contraseña aleatoria
  const generatePassword = () => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let newPassword = "";

    // Asegurar al menos un carácter de cada tipo
    newPassword += charset.charAt(Math.floor(Math.random() * 26)); // Mayúscula
    newPassword += charset.charAt(26 + Math.floor(Math.random() * 26)); // Minúscula
    newPassword += charset.charAt(52 + Math.floor(Math.random() * 10)); // Número
    newPassword += charset.charAt(62 + Math.floor(Math.random() * 8)); // Símbolo

    // Completar con caracteres aleatorios
    for (let i = 4; i < 10; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Mezclar los caracteres
    newPassword = newPassword
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setPassword(newPassword);
  };

  // Resetear la contraseña
  const resetPassword = async () => {
    if (!password || password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al resetear la contraseña");
      }

      // Mostrar credenciales
      setShowCredentials(true);

      // Notificar éxito
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al resetear la contraseña",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const downloadAsImage = () => {
    const credentialsCard = document.getElementById("credentials-card");
    if (credentialsCard) {
      // Usar html2canvas
      import("html2canvas")
        .then(({ default: html2canvas }) => {
          html2canvas(credentialsCard).then((canvas) => {
            const link = document.createElement("a");
            link.download = `credenciales-${user.name.replace(/\s+/g, "-")}.png`;
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

  const handleCloseCredentials = () => {
    setShowCredentials(false);
    setPassword("");
    onClose();
  };

  // Si estamos mostrando las credenciales
  if (showCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleCloseCredentials}>
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
                  <span>{user.name}</span>

                  <span className="font-semibold">Email:</span>
                  <span>{user.email}</span>

                  <span className="font-semibold">Contraseña:</span>
                  <span className="font-mono bg-accent/30 px-2 py-0.5 rounded text-accent-foreground">
                    {password}
                  </span>

                  <span className="font-semibold">Rol:</span>
                  <span>{user.userRole?.name || user.role}</span>
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
    );
  }

  // Diálogo para ingresar la nueva contraseña
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription>
            Establece una nueva contraseña para {user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Nueva contraseña
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                title="Generar contraseña"
                className="h-10 w-10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={resetPassword} disabled={isLoading}>
            {isLoading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para obtener los usuarios, incluyendo los eliminados
const useUsers = (includeDeleted: boolean = false) => {
  return useQuery({
    queryKey: ["users", { includeDeleted }],
    queryFn: async () => {
      const url = includeDeleted
        ? "/api/users?includeDeleted=true"
        : "/api/users";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al obtener usuarios");
      }
      const data = await response.json();
      return data.users || [];
    },
  });
};

// Hook para obtener el usuario actual y sus permisos
const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/users/me");
      if (!response.ok) {
        throw new Error("Error al obtener usuario actual");
      }
      const data = await response.json();
      return data.user || null;
    },
  });
};

// Componente de confirmación para eliminar usuario
function DeleteUserConfirmation({ isOpen, onClose, onConfirm, userName }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar al usuario <strong>{userName}</strong>.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: currentUser, isLoading: isLoadingCurrentUser } =
    useCurrentUser();
  const { data: users = [], isLoading } = useUsers(showDeleted);
  const queryClient = useQueryClient();

  // Verificar si el usuario actual es Super Administrador
  const isSuperAdmin = useMemo(() => {
    return currentUser?.userRole?.name === "Super Administrador";
  }, [currentUser]);

  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar usuario");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message || "Usuario eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para confirmar la eliminación de un usuario
  const handleDeleteUser = (user: User) => {
    setDeleteConfirmUser(user);
  };

  // Función para procesar la eliminación de un usuario
  const processDeleteUser = async () => {
    if (deleteConfirmUser) {
      try {
        // Verificar si el usuario tiene leads activos
        const response = await fetch(
          `/api/users/${deleteConfirmUser.id}/check-leads`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al verificar leads");
        }

        if (data.hasActiveLeads) {
          toast({
            title: "No se puede eliminar",
            description:
              "Este usuario tiene leads activos con ventas pendientes",
            variant: "destructive",
          });
          setDeleteConfirmUser(null);
          return;
        }

        // Proceder con la eliminación
        deleteUserMutation.mutate(deleteConfirmUser.id);
        setDeleteConfirmUser(null);
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Error al verificar leads",
          variant: "destructive",
        });
      }
    }
  };

  // Definir columnas
  const columnHelper = createColumnHelper<User>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("role", {
        header: "Rol",
        cell: (info) =>
          info.row.original.userRole?.name || info.row.original.role,
      }),
      columnHelper.accessor("isActive", {
        header: "Estado",
        cell: (info) => {
          const user = info.row.original;
          if (user.isDeleted) {
            return (
              <Badge variant="destructive" className="whitespace-nowrap">
                Eliminado
              </Badge>
            );
          }
          return (
            <Badge
              variant={user.isActive ? "default" : "secondary"}
              className={cn(
                "whitespace-nowrap",
                user.isActive ? "bg-green-500 hover:bg-green-600" : ""
              )}
            >
              {user.isActive ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => {
          const user = info.row.original;
          const isSelfUser = user.id === currentUser?.id;
          const isUserSuperAdmin =
            user.userRole?.name === "Super Administrador";

          // Deshabilitar acciones para usuarios eliminados o para usuarios inapropiados
          const canEdit =
            !user.isDeleted && hasPermission(currentUser, "users", "edit");
          const canResetPassword =
            !user.isDeleted && hasPermission(currentUser, "users", "edit");
          const canDelete =
            !user.isDeleted &&
            !isSelfUser &&
            !(isUserSuperAdmin && !isSuperAdmin);

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                  >
                    <span className="sr-only">Abrir menú</span>
                    <UserCog className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setEditingUser(user)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canResetPassword && (
                    <DropdownMenuItem
                      onClick={() => setResetPasswordUser(user)}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Restablecer contraseña
                    </DropdownMenuItem>
                  )}
                  {!user.isDeleted && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          canDelete ? handleDeleteUser(user) : null
                        }
                        className={cn(
                          "text-destructive focus:text-destructive",
                          !canDelete ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [currentUser, isSuperAdmin]
  );

  // Filtrar usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.userRole?.name || user.role)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Crear tabla
  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Refrescar lista de usuarios
  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona los usuarios del sistema y sus permisos
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-row gap-2 items-center">
          {isSuperAdmin && (
            <div className="flex items-center space-x-2">
              <Switch
                id="show-deleted"
                checked={showDeleted}
                onCheckedChange={setShowDeleted}
              />
              <label
                htmlFor="show-deleted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar eliminados
              </label>
            </div>
          )}
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de creación de usuario */}
      <CreateUserForm
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refreshUsers}
      />

      {/* Modal de edición de usuario */}
      {editingUser && (
        <EditUserForm
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={refreshUsers}
          user={editingUser}
        />
      )}

      {/* Diálogo de restablecimiento de contraseña */}
      {resetPasswordUser && (
        <ResetPasswordDialog
          open={!!resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          user={resetPasswordUser}
          onSuccess={refreshUsers}
        />
      )}

      {/* Confirmación de eliminación */}
      <DeleteUserConfirmation
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={processDeleteUser}
        userName={deleteConfirmUser?.name || ""}
      />
    </div>
  );
}
