import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Esquema de validación para los permisos
const permissionsSchema = z.record(
  z.record(
    z.union([
      z.literal("all"),
      z.literal("team"),
      z.literal("self"),
      z.literal(false),
    ])
  )
);

/**
 * Endpoint para aplicar los permisos de un rol a todos los usuarios que tengan ese rol asignado
 * Esto sobrescribirá los permisos personalizados que cada usuario pueda tener
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que el rol exista
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todos los usuarios con ese rol
    const usersWithRole = role.users;

    if (usersWithRole.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay usuarios con este rol" },
        { status: 400 }
      );
    }

    // Usar los permisos proporcionados en el body, o los del rol si no se proporcionan
    const permissionsToApply = body.permissions || role.permissions;

    // Aplicar permisos del rol a todos los usuarios
    const updateResults = await Promise.all(
      usersWithRole.map(async (user) => {
        const existingPermission = await prisma.userPermission.findUnique({
          where: { userId: user.id },
        });

        if (existingPermission) {
          // Actualizar permisos existentes
          return prisma.userPermission.update({
            where: { userId: user.id },
            data: {
              permissions: permissionsToApply as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          });
        } else {
          // Crear nuevos permisos
          return prisma.userPermission.create({
            data: {
              userId: user.id,
              permissions: permissionsToApply as Prisma.InputJsonValue,
            },
          });
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Permisos aplicados a ${updateResults.length} usuarios`,
      data: {
        usersCount: updateResults.length,
      },
    });
  } catch (error) {
    console.error("Error al aplicar permisos de rol:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al aplicar permisos de rol a los usuarios",
      },
      { status: 500 }
    );
  }
}
