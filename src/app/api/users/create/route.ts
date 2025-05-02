import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Esquema de validación para crear un usuario
const createUserSchema = z.object({
  id: z.string().uuid("ID de usuario inválido"),
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre demasiado corto"),
  roleId: z.string().uuid("ID de rol inválido"),
});

// POST /api/users/create - Crear un nuevo usuario
export async function POST(request: Request) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();

    // Validar datos con Zod
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { id, email, name, roleId } = result.data;

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "El usuario ya existe",
        },
        { status: 409 }
      );
    }

    // Crear el usuario en la tabla users
    const user = await prisma.user.create({
      data: {
        id,
        email,
        name,
        isActive: true,
        roleId,
        role: role.name, // Guardar también el nombre del rol para compatibilidad
      },
    });

    // Registrar en el changelog
    try {
      await prisma.activityLog.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "CREATE",
          description: `Usuario ${user.name} creado con rol ${role.name}`,
          performedById: user.id,
        },
      });
    } catch (logError) {
      console.error("Error al registrar actividad:", logError);
      // No interrumpir el flujo por error en el registro
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      {
        error: "Error al crear usuario",
      },
      { status: 500 }
    );
  }
}
