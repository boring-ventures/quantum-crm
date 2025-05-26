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
import { hasPermission } from "@/lib/utils/permissions";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@/types/user";

interface ReassignLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentUser: User;
  onSuccess: () => void;
  assignedToId?: string;
}

export function ReassignLeadDialog({
  open,
  onOpenChange,
  leadId,
  currentUser,
  onSuccess,
  assignedToId,
}: ReassignLeadDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios activos con permiso de editar leads
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        console.log(" ReassignLeadDialog data: ", data);
        if (!data.users) return setUsers([]);
        // Filtrar usuarios activos y con permiso de editar leads
        const filtered = data.users.filter(
          (u: User) =>
            u.isActive &&
            u.id !== assignedToId &&
            hasPermission(u, "leads", "edit")
        );
        setUsers(filtered);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, assignedToId]);

  const handleReassign = async () => {
    if (!selectedUserId) return;
    setSelecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newUserId: selectedUserId,
          performedBy: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reasignar lead");
      toast({
        title: "Lead reasignado",
        description: "El lead fue reasignado correctamente.",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al reasignar lead");
      toast({
        title: "Error",
        description: err.message || "Error al reasignar lead",
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
          <DialogTitle>Reasignar Lead</DialogTitle>
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
            Reasignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
