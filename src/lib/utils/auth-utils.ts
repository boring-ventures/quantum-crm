"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type User } from "@/types/user";
import prisma from "@/lib/prisma";

/**
 * Obtiene el usuario actual a partir de la sesión de Supabase
 * y carga todos sus datos completos incluyendo country y permisos
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Usar getUser en lugar de getSession para reducir solicitudes de token
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return null;
    }

    // Obtener datos completos del usuario desde prisma
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        country: true,
        userPermission: true,
      },
    });

    if (!user) {
      return null;
    }

    // Normalizar permisos a objeto JS
    let permissionsObj: Record<string, boolean> | undefined = undefined;
    if (user.userPermission?.permissions) {
      if (typeof user.userPermission.permissions === "string") {
        try {
          permissionsObj = JSON.parse(user.userPermission.permissions);
        } catch {
          permissionsObj = {};
        }
      } else {
        permissionsObj = user.userPermission.permissions as Record<
          string,
          boolean
        >;
      }
    }

    // Convertir a nuestro tipo User
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: user.roleId,
      isActive: user.isActive,
      isDeleted: user.isDeleted ?? false,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      deletedAt: user.deletedAt?.toISOString() || null,
      deletedBy: user.deletedBy || null,
      conversionRate: user.conversionRate || null,
      responseTime: user.responseTime || null,
      countryId: user.countryId || null,
      userPermission: user.userPermission
        ? {
            id: user.userPermission.id,
            userId: user.userPermission.userId,
            permissions: permissionsObj,
            createdAt: user.userPermission.createdAt.toISOString(),
            updatedAt: user.userPermission.updatedAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error("[AUTH] Error getting current user:", error);
    return null;
  }
}
