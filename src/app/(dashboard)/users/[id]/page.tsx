"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { UserGeneralForm } from "./components/user-general-form";
import { UserPermissionsEditor } from "./components/user-permissions-editor";
import { hasPermission } from "@/lib/utils/permissions";
import { User } from "@/types/user";

export default function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Cargar datos del usuario actual y del usuario a editar
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Cargar usuario actual para verificar permisos
        const currentUserResponse = await fetch("/api/users/me");
        if (!currentUserResponse.ok)
          throw new Error("Error al obtener usuario actual");
        const currentUserData = await currentUserResponse.json();
        setCurrentUser(currentUserData.user);

        // Cargar datos del usuario a editar
        const userResponse = await fetch(`/api/users/${params.id}`);
        if (!userResponse.ok)
          throw new Error("Error al obtener datos del usuario");
        const userData = await userResponse.json();
        setUser(userData.user);
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Error al cargar datos",
          variant: "destructive",
        });
        // Redirigir al listado de usuarios si hay error
        router.push("/users");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, router]);

  // Verificar permisos
  useEffect(() => {
    if (currentUser && !hasPermission(currentUser, "users", "edit")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para editar usuarios",
        variant: "destructive",
      });
      router.push("/users");
    }
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Detalles del Usuario: {user?.name}</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          {user && <UserGeneralForm userId={params.id} initialData={user} />}
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          {user && <UserPermissionsEditor userId={params.id} user={user} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
