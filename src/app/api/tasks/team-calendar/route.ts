import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taskTypes = searchParams.get("taskTypes");
    const status = searchParams.get("status");

    // Construir condiciones de filtro
    const where: any = {
      scheduledFor: {
        not: null,
      },
    };

    if (startDate) {
      where.scheduledFor = {
        ...where.scheduledFor,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.scheduledFor = {
        ...where.scheduledFor,
        lte: new Date(endDate),
      };
    }

    if (taskTypes) {
      // Mapear los tipos de tarea a títulos
      const typeList = taskTypes.split(",");
      const titleFilters: any[] = [];

      if (typeList.includes("test-drive")) {
        titleFilters.push({
          title: { contains: "Test Drive", mode: "insensitive" },
        });
      }
      if (typeList.includes("client-visit")) {
        titleFilters.push({
          title: { contains: "visita", mode: "insensitive" },
        });
      }

      if (titleFilters.length > 0) {
        where.OR = titleFilters;
      }
    }

    if (status) {
      const statusList = status.split(",");
      where.status = {
        in: statusList,
      };
    }

    // Obtener las tareas con relaciones
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            cellphone: true,
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TEAM_CALENDAR_API]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
