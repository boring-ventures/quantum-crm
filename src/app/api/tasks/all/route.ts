import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el id del usuario autenticado
    const userId = currentUser.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario no encontrado" },
        { status: 400 }
      );
    }

    // Obtener rol del usuario desde el perfil
    const userRole = currentUser.role || "";
    const isManagerRole =
      userRole === "Administrador" || userRole === "Super Administrador";

    // Parámetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // opcional: filtrar por estado
    const assignedToId = searchParams.get("assignedToId"); // ID del vendedor específico
    const countryId = searchParams.get("countryId"); // ID del país para filtro de equipo

    console.log("[API] /tasks/all - Procesando solicitud");
    console.log("[API] /tasks/all - rol:", userRole);
    console.log("[API] /tasks/all - isManagerRole:", isManagerRole);
    console.log("[API] /tasks/all - userId:", userId);
    console.log("[API] /tasks/all - assignedToId:", assignedToId);
    console.log("[API] /tasks/all - countryId:", countryId);

    // Construir el objeto where para filtrar tareas
    const where: any = {
      // Excluir tareas cuyos leads estén cerrados o archivados
      lead: {
        isClosed: false,
        isArchived: false,
      },
    };

    // Si se especifica un vendedor específico, filtrar por ese usuario
    if (assignedToId) {
      where.assignedToId = assignedToId;
    } else if (isManagerRole) {
      // Si es admin y no hay vendedor específico, aplicar filtros según permisos
      if (countryId) {
        // Filtro por equipo (país)
        where.assignedTo = {
          countryId: countryId,
        };
      }
      // Si no hay countryId, mostrar todas las tareas (permiso global)
    } else {
      // Si no es admin, solo mostrar sus propias tareas
      where.assignedToId = userId;
    }

    // Agregar filtro de estado si se especifica
    if (status) {
      where.status = status;
    }

    // Consultar tareas según los filtros aplicados
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
            cellphone: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            countryId: true,
          },
        },
      },
    });

    console.log("[API] /tasks/all - Tareas encontradas:", tasks.length);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener todas las tareas" },
      { status: 500 }
    );
  }
}
