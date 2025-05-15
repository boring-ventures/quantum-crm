import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Verificar autenticación usando auth helper
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener ID del usuario de la sesión
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario no encontrado en sesión" },
        { status: 400 }
      );
    }

    // Obtener el usuario de Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Adaptar la respuesta para mantener compatibilidad
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      roleId: user.roleId,
      permissions: user.userRole?.permissions || {},
      userRole: user.userRole,
    };

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error(
      "Error al obtener usuario actual:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    return NextResponse.json(
      { error: "Error al obtener datos del usuario actual" },
      { status: 500 }
    );
  }
}
