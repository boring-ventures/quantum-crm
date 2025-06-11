"use client";

import Link from "next/link";
import { BadgeCheck, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { useUserStore } from "@/store/userStore";

export function ProfileDropdown() {
  const { profile, user, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const { clearUser } = useUserStore();

  if (isLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse" />
      </Button>
    );
  }

  if (!profile || !user) return null;

  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile.firstName || profile.lastName) {
      return [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 ring-2 ring-primary/10">
            <AvatarImage
              src={profile.avatarUrl || ""}
              alt={displayName || user.email || "User"}
            />
            <AvatarFallback className="bg-primary/10">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {displayName || user.email?.split("@")[0]}
              </p>
              <Badge variant="outline" className="ml-2 text-xs">
                {getRoleDisplay(profile.role)}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </DropdownMenuItem>
          {profile.role && profile.role.toString() === "SUPERADMIN" && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            try {
              await signOut();
              clearUser();

              // Limpiar cualquier caché adicional que pueda existir
              if (typeof window !== "undefined") {
                const keysToRemove = [
                  "user-storage",
                  "user-storage-v1",
                  "supabase.auth.token",
                ];
                keysToRemove.forEach((key) => {
                  try {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                  } catch (e) {
                    // Ignorar errores
                  }
                });
              }
            } catch (error) {
              clearUser();
              console.error("Error al cerrar sesión:", error);
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
