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

    // Obtener rol del usuario desde la sesión
    const userRole = session.user?.role || "";
    const isManagerRole =
      userRole === "Administrador" || userRole === "Super Administrador";

    // Parámetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // opcional: filtrar por estado
    const priority = searchParams.get("priority"); // opcional: para el futuro
    const requestedAssignedToId = searchParams.get("assignedToId"); // ID del vendedor solicitado

    // Determinar el ID del vendedor a filtrar
    // Si es admin/superadmin y hay un ID específico solicitado, usar ese ID
    // De lo contrario, si es vendedor, usar solo su propio ID
    const effectiveAssignedToId =
      isManagerRole && requestedAssignedToId ? requestedAssignedToId : userId;

    console.log("[API] /tasks/user - Procesando solicitud");
    console.log("[API] /tasks/user - rol:", userRole);
    console.log("[API] /tasks/user - isManagerRole:", isManagerRole);
    console.log("[API] /tasks/user - userId:", userId);
    console.log(
      "[API] /tasks/user - requestedAssignedToId:",
      requestedAssignedToId
    );
    console.log(
      "[API] /tasks/user - effectiveAssignedToId:",
      effectiveAssignedToId
    );

    // Construir el objeto where para filtrar tareas
    const where: any = {
      assignedToId: effectiveAssignedToId,
      // Excluir tareas cuyos leads estén cerrados o archivados
      lead: {
        isClosed: false,
        isArchived: false,
      },
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
            cellphone: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
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
