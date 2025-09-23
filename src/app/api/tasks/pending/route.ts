import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con util seguro para Route Handlers
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parámetros para limitar la cantidad de tareas y filtrar por vendedor
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const assignedToId = searchParams.get("assignedToId");

    console.log("[API] /tasks/pending - Procesando solicitud");
    console.log("[API] /tasks/pending - assignedToId:", assignedToId);
    console.log("[API] /tasks/pending - currentUser.id:", currentUser.id);

    // Si no hay ID de vendedor específico y no es una vista administrativa,
    // usar el ID del usuario actual en sesión
    const userId = assignedToId || currentUser.id;
    console.log("[API] /tasks/pending - userId efectivo:", userId);

    // Obtener la fecha actual para filtrar tareas por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Construir el objeto de filtro para incluir el filtro de asignación al lead
    let whereClause: any = {
      status: "PENDING",
      lead: {
        assignedToId: userId,
      },
    };

    console.log(
      "[API] /tasks/pending - Usando whereClause:",
      JSON.stringify(whereClause)
    );

    // Consultar tareas pendientes con información del lead
    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        // Primero las tareas con fecha programada
        { scheduledFor: { sort: "asc", nulls: "last" } },
        // Después por fecha de creación
        { createdAt: "desc" },
      ],
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isArchived: true,
            assignedToId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
    });

    console.log(
      `[API] /tasks/pending - Encontradas ${tasks.length} tareas para el usuario ${userId}`
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener las tareas pendientes" },
      { status: 500 }
    );
  }
}
