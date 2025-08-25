"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";
import { Bell } from "lucide-react";

interface NewLeadsCardProps {
  value: number;
}

export function NewLeadsCard({ value }: NewLeadsCardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  const handleCardClick = () => {
    if (
      user &&
      user.userPermission &&
      hasPermission(user.userPermission.permissions, "leads", "view")
    ) {
      router.push("/leads?status=new");
    } else {
      console.warn("Acceso denegado a la sección: leads");
      alert("No tienes permiso para acceder a esta sección.");
    }
  };

  const canViewSection =
    user &&
    user.userPermission &&
    hasPermission(user.userPermission.permissions, "leads", "view");

  return (
    <Card
      onClick={handleCardClick}
      className={`
        ${
          canViewSection
            ? "cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out"
            : "opacity-60 cursor-not-allowed"
        }
        flex flex-col justify-between h-full bg-gradient-to-br from-background to-muted/10 border-2 border-border/30 hover:border-primary/30
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Leads Nuevos
        </CardTitle>
        <div className="relative">
          <Bell className="h-6 w-6 text-yellow-500" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">1</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4 flex-grow flex flex-col justify-center">
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          Leads generados en los últimos 7 días
        </p>
      </CardContent>
    </Card>
  );
}
