import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Esquema de validación para actualizar rol
const updateRoleSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
  roleId: z.string().uuid("ID de rol inválido"),
});

// POST /api/users/update-role - Actualizar rol de usuario
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener y validar datos
    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { userId, roleId } = result.data;

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: roleId,
        role: role.name, // Actualizar también el campo role para mantener compatibilidad
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return NextResponse.json(
      { error: "Error al actualizar rol de usuario" },
      { status: 500 }
    );
  }
}
