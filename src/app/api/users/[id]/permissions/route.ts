import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hasPermission_user as hasPermission } from "@/lib/utils/permissions";
import { Prisma } from "@prisma/client";
import { User, UserPermission } from "@/types/user";

// Esquema de validación
const updatePermissionsSchema = z.object({
  permissions: z.record(z.any()),
  resetToRole: z.boolean().optional(),
});

type JsonPermissions = Prisma.JsonValue;

// Manejar petición PUT para actualizar permisos
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Cargar el usuario actual para verificar permisos
    const currentUserData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userPermission: true },
    });

    if (!currentUserData) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Convertir a tipo User adecuado para hasPermission
    const currentUser: User = {
      id: currentUserData.id,
      name: currentUserData.name,
      email: currentUserData.email,
      role: currentUserData.role,
      roleId: currentUserData.roleId || undefined,
      isActive: currentUserData.isActive,
      countryId: currentUserData.countryId || undefined,
      userPermission: currentUserData.userPermission
        ? {
            id: currentUserData.userPermission.id,
            userId: currentUserData.userPermission.userId,
            permissions: currentUserData.userPermission.permissions,
            createdAt: currentUserData.userPermission.createdAt.toISOString(),
            updatedAt: currentUserData.userPermission.updatedAt.toISOString(),
          }
        : undefined,
      createdAt: currentUserData.createdAt.toISOString(),
      updatedAt: currentUserData.updatedAt.toISOString(),
    };

    // Verificar permisos para editar usuarios
    if (!hasPermission(currentUser, "users", "edit")) {
      return NextResponse.json(
        { error: "No tienes permiso para editar usuarios" },
        { status: 403 }
      );
    }

    // Validar datos de entrada
    const json = await request.json();
    const validationResult = updatePermissionsSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { permissions, resetToRole } = validationResult.data;

    // Verificar si el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario objetivo no encontrado" },
        { status: 404 }
      );
    }

    // Si se pide resetear a los permisos del rol, registrar en el log
    const description = resetToRole
      ? `Permisos de usuario ${targetUser.name} restablecidos a los del rol`
      : `Permisos de usuario ${targetUser.name} actualizados`;

    // Convertir los permisos a JsonValue para Prisma
    const permissionsJson = permissions as Prisma.InputJsonValue;

    // Crear o actualizar permisos del usuario
    const userPermission = await prisma.userPermission.upsert({
      where: { userId: params.id },
      update: { permissions: permissionsJson },
      create: {
        userId: params.id,
        permissions: permissionsJson,
      },
    });

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        entityType: "USER_PERMISSION",
        entityId: params.id,
        action: resetToRole ? "RESET" : "UPDATE",
        description,
        performedById: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Permisos actualizados correctamente",
        userPermission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar permisos:", error);
    return NextResponse.json(
      { error: "Error al actualizar permisos" },
      { status: 500 }
    );
  }
}

// Manejar petición GET para obtener permisos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Cargar el usuario actual para verificar permisos
    const currentUserData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userPermission: true },
    });

    if (!currentUserData) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Convertir a tipo User adecuado para hasPermission
    const currentUser: User = {
      id: currentUserData.id,
      name: currentUserData.name,
      email: currentUserData.email,
      role: currentUserData.role,
      roleId: currentUserData.roleId || undefined,
      isActive: currentUserData.isActive,
      countryId: currentUserData.countryId || undefined,
      userPermission: currentUserData.userPermission
        ? {
            id: currentUserData.userPermission.id,
            userId: currentUserData.userPermission.userId,
            permissions: currentUserData.userPermission.permissions,
            createdAt: currentUserData.userPermission.createdAt.toISOString(),
            updatedAt: currentUserData.userPermission.updatedAt.toISOString(),
          }
        : undefined,
      createdAt: currentUserData.createdAt.toISOString(),
      updatedAt: currentUserData.updatedAt.toISOString(),
    };

    // Verificar permisos para ver usuarios
    if (!hasPermission(currentUser, "users", "view")) {
      return NextResponse.json(
        { error: "No tienes permiso para ver usuarios" },
        { status: 403 }
      );
    }

    // Obtener permisos del usuario objetivo
    const userPermission = await prisma.userPermission.findUnique({
      where: { userId: params.id },
    });

    // Si no tiene permisos específicos, obtener permisos del rol
    if (!userPermission) {
      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        include: { userRole: true },
      });

      if (!targetUser || !targetUser.userRole) {
        return NextResponse.json(
          { error: "No se encontraron permisos para el usuario" },
          { status: 404 }
        );
      }

      // Devolver permisos del rol
      return NextResponse.json({
        permissions: targetUser.userRole.permissions,
        isRoleDefault: true,
      });
    }

    // Devolver permisos personalizados
    return NextResponse.json({
      permissions: userPermission.permissions,
      isRoleDefault: false,
    });
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json(
      { error: "Error al obtener permisos" },
      { status: 500 }
    );
  }
}
