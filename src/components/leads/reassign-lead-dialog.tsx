import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@/types/user";

interface ReassignLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | string[];
  currentUser: User;
  onSuccess: () => void;
  assignedToId?: string;
  isBulkReassign?: boolean;
}

export function ReassignLeadDialog({
  open,
  onOpenChange,
  leadId,
  currentUser,
  onSuccess,
  assignedToId,
  isBulkReassign = false,
}: ReassignLeadDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Obtener el scope de permisos del usuario actual
  const userScope = getScope(currentUser, "leads", "edit");

  // Cargar usuarios activos con permiso de editar leads según el scope
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Construir los parámetros de la consulta según el scope
    const params = new URLSearchParams();
    params.append("hasPermission", "leads.edit");

    // Filtrar por país si el scope es "team"
    if (userScope === "team" && currentUser.countryId) {
      params.append("countryId", currentUser.countryId);
    }

    // Agregar scope como parámetro
    params.append("scope", userScope || "self");

    fetch(`/api/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.users) return setUsers([]);
        // Filtrar usuarios según las reglas de scope
        const filtered = data.users.filter((u: User) => {
          // No mostrar el usuario actual
          if (u.id === currentUser.id) return false;

          // No mostrar el usuario actualmente asignado
          if (u.id === assignedToId) return false;

          // Verificar que el usuario esté activo
          if (!u.isActive) return false;

          // Verificar permisos según el scope
          const userPermScope = getScope(u, "leads", "edit");

          switch (userScope) {
            case "all":
              return true; // Puede ver todos
            case "team":
              // Solo usuarios del mismo país con scope self o team
              return (
                u.countryId === currentUser.countryId &&
                (userPermScope === "self" || userPermScope === "team")
              );
            case "self":
              // Solo usuarios con scope self
              return userPermScope === "self";
            default:
              return false;
          }
        });
        setUsers(filtered);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, assignedToId, currentUser, userScope]);

  const handleReassign = async () => {
    if (!selectedUserId) return;
    setSelecting(true);
    setError(null);
    try {
      const endpoint = isBulkReassign
        ? `/api/leads/bulk-reassign`
        : `/api/leads/${leadId}/reassign`;

      const body = isBulkReassign
        ? {
            leadIds: leadId,
            newUserId: selectedUserId,
            performedBy: currentUser.id,
          }
        : {
            newUserId: selectedUserId,
            performedBy: currentUser.id,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reasignar lead(s)");

      toast({
        title: isBulkReassign ? "Leads reasignados" : "Lead reasignado",
        description: isBulkReassign
          ? "Los leads fueron reasignados correctamente."
          : "El lead fue reasignado correctamente.",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al reasignar lead(s)");
      toast({
        title: "Error",
        description: err.message || "Error al reasignar lead(s)",
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isBulkReassign ? "Reasignación Masiva de Leads" : "Reasignar Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-gray-500">Cargando usuarios...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center">
              Sin usuarios disponibles
            </div>
          ) : (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}{" "}
                    <span className="text-xs text-gray-400">({u.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={selecting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedUserId || selecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {selecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isBulkReassign ? "Reasignar Leads" : "Reasignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
