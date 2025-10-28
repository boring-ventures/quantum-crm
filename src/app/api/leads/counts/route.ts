import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { getScope } from "@/lib/utils/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedToId = searchParams.get("assignedToId");
    const countryId = searchParams.get("countryId");
    const leadStatus = searchParams.get("leadStatus"); // "active", "closed", "archived"

    // Construir condiciones base
    const where: any = {};

    // Filtro por estado de lead
    if (leadStatus === "active") {
      where.isArchived = false;
      where.isClosed = false;
    } else if (leadStatus === "closed") {
      where.isArchived = false;
      where.isClosed = true;
    } else if (leadStatus === "archived") {
      where.isArchived = true;
    }

    // Aplicar restricciones basadas en permisos
    const viewScope = getScope(currentUser, "leads", "view");

    if (viewScope === "self") {
      where.assignedToId = currentUser.id;
    } else if (viewScope === "team" && currentUser.countryId) {
      where.assignedTo = {
        countryId: currentUser.countryId,
      };
    }

    // Aplicar filtros adicionales
    if (assignedToId) where.assignedToId = assignedToId;
    if (countryId) {
      where.assignedTo = {
        countryId: countryId,
      };
    }

    // Obtener todos los leads con relaciones necesarias para contar
    const allLeads = await prisma.lead.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            scheduledFor: true,
          },
        },
      },
    });

    // Filtrar leads "buenos" (no BAD_LEAD) para cálculos
    const goodLeads = allLeads.filter((lead) => lead.qualification !== "BAD_LEAD");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calcular conteos
    const counts = {
      all: allLeads.length, // Incluye TODOS los leads, incluyendo BAD_LEAD
      // Sin Gestión: leads sin tareas (solo leads buenos)
      noManagement: goodLeads.filter(
        (lead) => !lead.tasks || lead.tasks.length === 0
      ).length,
      // Tareas de Hoy: leads con tareas pendientes programadas para hoy
      todayTasks: goodLeads.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;
        return lead.tasks.some((task) => {
          if (!task.scheduledFor || task.status !== "PENDING") return false;
          const taskDate = new Date(task.scheduledFor);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
      }).length,
      // Tareas Vencidas: leads con tareas pendientes vencidas
      overdueTasks: goodLeads.filter((lead) => {
        if (!lead.tasks || lead.tasks.length === 0) return false;
        return lead.tasks.some((task) => {
          if (!task.scheduledFor || task.status !== "PENDING") return false;
          const taskDate = new Date(task.scheduledFor);
          return taskDate < today;
        });
      }).length,
      // Favoritos
      favorites: goodLeads.filter((lead) => lead.isFavorite).length,
    };

    return NextResponse.json(counts);
  } catch (e) {
    console.error("Error calculating lead counts:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Error al calcular conteos",
      },
      { status: 500 }
    );
  }
}
