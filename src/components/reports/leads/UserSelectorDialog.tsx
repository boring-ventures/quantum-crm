"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectorDialogProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function UserSelectorDialog({
  selectedIds,
  onChange,
  className,
}: UserSelectorDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["users-all"],
    queryFn: async (): Promise<User[]> => {
      const res = await fetch("/api/users/all?active=true");
      const json = await res.json();
      return json.users as User[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [internalSelection, setInternalSelection] =
    useState<string[]>(selectedIds);

  // When dialog opens for the first time and no selection, default all users selected
  useEffect(() => {
    if (data && selectedIds.length === 0) {
      const allIds = data.map((u) => u.id);
      setInternalSelection(allIds);
      onChange(allIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const toggleId = (id: string) => {
    setInternalSelection((prev) => {
      const exists = prev.includes(id);
      return exists ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleApply = () => {
    onChange(internalSelection);
  };

  const handleSelectAll = () => {
    if (!data) return;
    const allIds = data.map((u) => u.id);
    setInternalSelection(allIds);
  };

  const handleClear = () => {
    setInternalSelection([]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          Vendedores
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {selectedIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona vendedores</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading && <p>Cargando usuarios…</p>}
          {data && (
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-2">
                {data.map((user) => {
                  const checked = internalSelection.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleId(user.id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-between">
          <div className="space-x-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Todos
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Ninguno
            </Button>
          </div>
          <DialogClose asChild>
            <Button size="sm" onClick={handleApply}>
              Aplicar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
