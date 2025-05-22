"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PermissionEditor, {
  PermissionMap,
} from "@/components/admin/permission-editor";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import type { User } from "@/types/user";
import type { Role } from "@/types/role";

type UserPermissionsEditorProps = {
  userId: string;
  user: User;
};

export function UserPermissionsEditor({
  userId,
  user,
}: UserPermissionsEditorProps) {
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [originalPermissions, setOriginalPermissions] = useState<PermissionMap>(
    {}
  );
  const [rolePermissions, setRolePermissions] = useState<PermissionMap | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Cargar permisos actuales del usuario y del rol
  useEffect(() => {
    async function loadPermissions() {
      try {
        setIsLoading(true);

        // Cargar permisos del usuario
        let userPermissionsData: PermissionMap = {};

        if (user.userPermission) {
          // Si el usuario tiene permisos personalizados, usarlos
          userPermissionsData =
            typeof user.userPermission.permissions === "string"
              ? JSON.parse(user.userPermission.permissions)
              : user.userPermission.permissions;
        } else if (user.roleId) {
          // Si no, cargar permisos del rol
          const roleResponse = await fetch(`/api/roles/${user.roleId}`);
          if (!roleResponse.ok)
            throw new Error("Error al cargar permisos del rol");

          const roleData = await roleResponse.json();

          if (roleData.success && roleData.data) {
            const role = roleData.data as Role;
            userPermissionsData =
              typeof role.permissions === "string"
                ? JSON.parse(role.permissions)
                : role.permissions;

            // Guardar permisos del rol para posible reseteo
            setRolePermissions(userPermissionsData);
          }
        }

        setPermissions(userPermissionsData);
        setOriginalPermissions(userPermissionsData);
      } catch (error) {
        console.error("Error loading permissions:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los permisos del usuario",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [user]);

  // Manejar cambios en los permisos
  const handlePermissionsChange = (newPermissions: PermissionMap) => {
    setPermissions(newPermissions);
  };

  // Guardar permisos
  const savePermissions = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar permisos");
      }

      // Actualizar permisos originales después de guardar
      setOriginalPermissions({ ...permissions });

      toast({
        title: "Permisos guardados",
        description:
          "Los permisos del usuario se han actualizado correctamente",
      });
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar permisos",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear permisos a los del rol
  const resetToRolePermissions = async () => {
    if (!user.roleId || !rolePermissions) {
      toast({
        title: "Error",
        description: "No se encontraron permisos del rol para restaurar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResetting(true);

      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: rolePermissions,
          resetToRole: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al resetear permisos");
      }

      // Actualizar permisos en la UI
      setPermissions({ ...rolePermissions });
      setOriginalPermissions({ ...rolePermissions });

      toast({
        title: "Permisos restaurados",
        description: "Se han restaurado los permisos predeterminados del rol",
      });

      setIsResetDialogOpen(false);
    } catch (error) {
      console.error("Error resetting permissions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al resetear permisos",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  // Copiar permisos al portapapeles
  const copyPermissionsToClipboard = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(permissions, null, 2));
      toast({
        title: "Permisos copiados",
        description: "Los permisos se han copiado al portapapeles",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "No se pudieron copiar los permisos al portapapeles",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cargando permisos...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Permisos de Usuario</CardTitle>
          <CardDescription>
            Configura los permisos específicos para este usuario. Estos permisos
            sobrescribirán los asignados por su rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PermissionEditor
              permissions={permissions}
              onChange={handlePermissionsChange}
            />

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                onClick={savePermissions}
                disabled={isSaving || !hasUnsavedChanges()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(true)}
                disabled={!user.roleId || !rolePermissions || isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Restaurar permisos del rol
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={copyPermissionsToClipboard}
                className="ml-auto"
              >
                Copiar como JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para resetear permisos */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar permisos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará todos los permisos personalizados y restaurará los
              permisos predeterminados del rol actual del usuario. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={resetToRolePermissions}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
