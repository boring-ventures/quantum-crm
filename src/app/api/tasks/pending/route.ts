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

    // Parámetros para limitar la cantidad de tareas
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // Obtener la fecha actual para filtrar tareas por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Consultar tareas pendientes con información del lead
    const tasks = await prisma.task.findMany({
      where: {
        status: "PENDING",
        // Opcionalmente podríamos filtrar tareas para hoy o vencidas
        // scheduledFor: {
        //   lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Hasta mañana
        // }
      },
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener las tareas pendientes" },
      { status: 500 }
    );
  }
}
