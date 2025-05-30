"use client";

import {
  UserCog,
  Search,
  Plus,
  Eye,
  Users,
  Key,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PermissionEditor, {
  PermissionMap,
} from "@/components/admin/permission-editor";

// Tipos para los datos
interface Role {
  id: string;
  name: string;
  permissions: any;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  countryId?: string;
  country?: {
    name: string;
  };
  userPermission?: {
    id: string;
    permissions: any;
  } | null;
}

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [usersWithRole, setUsersWithRole] = useState<User[]>([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyingPermissions, setApplyingPermissions] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<PermissionMap>({});
  const { toast } = useToast();
  const { user: currentUser } = useUserStore();

  // Permisos
  const canViewRoles = hasPermission(currentUser, "roles", "view");
  const canCreateRoles = hasPermission(currentUser, "roles", "create");
  const canEditRoles = hasPermission(currentUser, "roles", "edit");
  const canDeleteRoles = hasPermission(currentUser, "roles", "delete");

  // Validar acceso a la página
  if (!canViewRoles) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
      </div>
    );
  }

  // Cargar roles al iniciar
  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        const response = await fetch("/api/roles?includeUserCount=true");
        if (!response.ok) throw new Error("Error al cargar roles");

        const data = await response.json();
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Error al cargar roles:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [toast]);

  // Filtrar roles por búsqueda
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar detalles de un rol específico
  const loadRoleDetails = async (role: Role) => {
    if (!canViewRoles) {
      toast({
        title: "Error",
        description: "No tienes permisos para ver detalles de roles",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedRole(role);

      // Cargar los usuarios asociados a este rol
      const response = await fetch(`/api/roles/${role.id}`);
      if (!response.ok) throw new Error("Error al cargar detalles del rol");

      const data = await response.json();
      if (data.success && data.data) {
        setSelectedRole(data.data);
        setUsersWithRole(data.data.users || []);
        setEditedPermissions({});
      }
    } catch (error) {
      console.error("Error al cargar detalles del rol:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del rol",
        variant: "destructive",
      });
    }
  };

  // Manejar cambios en los permisos editados
  const handlePermissionsChange = (permissions: PermissionMap) => {
    if (!canEditRoles) {
      toast({
        title: "Error",
        description: "No tienes permisos para editar roles",
        variant: "destructive",
      });
      return;
    }
    setEditedPermissions(permissions);
  };

  // Aplicar los permisos del rol a todos los usuarios
  const applyPermissionsToUsers = async () => {
    if (!selectedRole || !canEditRoles) {
      toast({
        title: "Error",
        description: "No tienes permisos para aplicar permisos a usuarios",
        variant: "destructive",
      });
      return;
    }

    // Preparar los permisos a aplicar (usar los editados si existen, sino los originales)
    const permissionsToApply =
      Object.keys(editedPermissions).length > 0
        ? editedPermissions
        : selectedRole.permissions;

    try {
      setApplyingPermissions(true);
      const response = await fetch(
        `/api/roles/${selectedRole.id}/apply-permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions: permissionsToApply }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: `Se han aplicado los permisos a ${data.data.usersCount} usuarios`,
        });

        // Actualizar también los permisos del rol si fueron editados
        if (Object.keys(editedPermissions).length > 0) {
          await updateRolePermissions(selectedRole.id, permissionsToApply);
        }

        setShowApplyDialog(false);
      } else {
        throw new Error(data.error || "Error al aplicar permisos");
      }
    } catch (error) {
      console.error("Error al aplicar permisos:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al aplicar permisos a los usuarios",
        variant: "destructive",
      });
    } finally {
      setApplyingPermissions(false);
    }
  };

  // Actualizar los permisos del rol
  const updateRolePermissions = async (roleId: string, permissions: any) => {
    if (!canEditRoles) {
      toast({
        title: "Error",
        description: "No tienes permisos para actualizar roles",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizar el rol en el estado local
        setRoles((prevRoles) =>
          prevRoles.map((r) => (r.id === roleId ? { ...r, permissions } : r))
        );

        // Actualizar el rol seleccionado
        if (selectedRole && selectedRole.id === roleId) {
          setSelectedRole({
            ...selectedRole,
            permissions,
          });
        }

        toast({
          title: "Éxito",
          description: "Se han actualizado los permisos del rol",
        });
      } else {
        throw new Error(data.error || "Error al actualizar permisos del rol");
      }
    } catch (error) {
      console.error("Error al actualizar permisos del rol:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar permisos del rol",
        variant: "destructive",
      });
    }
  };

  // Formatear JSON para mostrarlo bonito
  const formatJSON = (json: any) => {
    try {
      if (typeof json === "string") {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return JSON.stringify(json);
    }
  };

  // Copiar JSON al portapapeles
  const copyToClipboard = (json: any) => {
    navigator.clipboard.writeText(formatJSON(json));
    toast({
      title: "Copiado",
      description: "Permisos copiados al portapapeles",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Roles y Permisos</h1>
        <p className="text-muted-foreground">
          Configura los roles de usuario y sus permisos en el sistema
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar roles..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de roles */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  Cargando roles...
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  No se encontraron roles
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role._count?.users || 0} usuarios</TableCell>
                  <TableCell>
                    <Badge
                      variant={role.isActive ? "default" : "destructive"}
                      className={cn(
                        "whitespace-nowrap",
                        role.isActive ? "bg-green-500 hover:bg-green-600" : ""
                      )}
                    >
                      {role.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canViewRoles && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => loadRoleDetails(role)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalles</span>
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Rol: {selectedRole?.name}</DialogTitle>
                            <DialogDescription>
                              Administra los permisos y usuarios asociados a
                              este rol
                            </DialogDescription>
                          </DialogHeader>

                          <div className="flex-1 overflow-hidden">
                            <Tabs
                              defaultValue="permissions"
                              className="mt-4 h-full"
                            >
                              <TabsList>
                                <TabsTrigger value="permissions">
                                  <Key className="h-4 w-4 mr-2" />
                                  Permisos
                                </TabsTrigger>
                                <TabsTrigger value="users">
                                  <Users className="h-4 w-4 mr-2" />
                                  Usuarios ({usersWithRole.length})
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent
                                value="permissions"
                                className="mt-4 h-full"
                              >
                                <div className="flex justify-end mb-4">
                                  {canEditRoles && (
                                    <Button
                                      onClick={() => setShowApplyDialog(true)}
                                      disabled={!usersWithRole.length}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Aplicar a todos los usuarios
                                    </Button>
                                  )}
                                </div>

                                <div className="overflow-hidden">
                                  {selectedRole && (
                                    <PermissionEditor
                                      permissions={selectedRole.permissions}
                                      onChange={handlePermissionsChange}
                                      onExportJson={() =>
                                        copyToClipboard(
                                          Object.keys(editedPermissions)
                                            .length > 0
                                            ? editedPermissions
                                            : selectedRole.permissions
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="users" className="mt-4">
                                <div className="relative w-full max-w-sm mb-4">
                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="search"
                                    placeholder="Buscar usuarios..."
                                    className="pl-8"
                                  />
                                </div>

                                <ScrollArea className="h-[300px]">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>País</TableHead>
                                        <TableHead>
                                          Permisos personalizados
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {usersWithRole.length === 0 ? (
                                        <TableRow>
                                          <TableCell
                                            colSpan={5}
                                            className="h-32 text-center"
                                          >
                                            No hay usuarios con este rol
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        usersWithRole.map((user) => (
                                          <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                              {user.name}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                              {user.country?.name || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {user.userPermission ? (
                                                <Badge>Personalizados</Badge>
                                              ) : (
                                                <Badge variant="outline">
                                                  Predet.
                                                </Badge>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </ScrollArea>
                              </TabsContent>
                            </Tabs>
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                            {canEditRoles &&
                              Object.keys(editedPermissions).length > 0 && (
                                <Button
                                  onClick={() =>
                                    updateRolePermissions(
                                      selectedRole!.id,
                                      editedPermissions
                                    )
                                  }
                                >
                                  Guardar cambios
                                </Button>
                              )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmación para aplicar permisos */}
      <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Aplicar permisos a todos los usuarios?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esto sobrescribirá los permisos actuales de todos los usuarios con
              este rol. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingPermissions}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                applyPermissionsToUsers();
              }}
              disabled={applyingPermissions}
            >
              {applyingPermissions ? "Aplicando..." : "Sí, aplicar permisos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
