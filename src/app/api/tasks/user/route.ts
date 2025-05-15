import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el id del usuario autenticado
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario no encontrado" },
        { status: 400 }
      );
    }

    // Parámetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // opcional: filtrar por estado
    const priority = searchParams.get("priority"); // opcional: para el futuro

    // Construir el objeto where para filtrar tareas
    const where: any = {
      assignedToId: userId,
    };

    // Agregar filtro de estado si se especifica
    if (status) {
      where.status = status;
    }

    // Consultar tareas del usuario con información adicional
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        // Primero tareas pendientes, luego en progreso, etc.
        { status: "asc" },
        // Dentro de cada estado, ordenar por fecha programada (si existe)
        { scheduledFor: { sort: "asc", nulls: "last" } },
        // Finalmente por fecha de creación (más recientes primero)
        { createdAt: "desc" },
      ],
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener las tareas del usuario" },
      { status: 500 }
    );
  }
}
