import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getScope } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export async function POST(req: Request) {
  try {
    const { filters, userId, countryId } = await req.json();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Determinar scope de permisos
    const leadsScope = getScope(currentUser, "leads", "view");

    // Construir filtros base según permisos
    const baseFilter: any = {};
    if (leadsScope === "self") {
      baseFilter.assignedToId = currentUser.id;
    } else if (leadsScope === "team" && currentUser.countryId) {
      baseFilter.assignedTo = {
        countryId: currentUser.countryId,
      };
    }

    // Agregar filtros adicionales
    if (filters.company !== "all-companies") {
      baseFilter.companyId = filters.company;
    }

    // Obtener métricas
    const [
      totalLeads,
      leadsThisMonth,
      activeQuotations,
      completedSales,
      pendingTasks,
      overdueTasks,
    ] = await Promise.all([
      // Total de leads activos
      prisma.lead.count({
        where: {
          ...baseFilter,
          isArchived: false,
          qualification: { not: "BAD_LEAD" },
        },
      }),

      // Leads este mes
      prisma.lead.count({
        where: {
          ...baseFilter,
          isArchived: false,
          qualification: { not: "BAD_LEAD" },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Cotizaciones activas
      prisma.quotation.count({
        where: {
          ...baseFilter,
          status: "DRAFT",
          lead: {
            isArchived: false,
          },
        },
      }),

      // Ventas completadas
      prisma.sale.count({
        where: {
          ...baseFilter,
          status: "COMPLETED",
          lead: {
            isArchived: false,
          },
        },
      }),

      // Tareas pendientes
      prisma.task.count({
        where: {
          ...baseFilter,
          status: "PENDING",
          lead: {
            isArchived: false,
          },
        },
      }),

      // Tareas vencidas
      prisma.task.count({
        where: {
          ...baseFilter,
          status: "PENDING",
          scheduledFor: {
            lt: new Date(),
          },
          lead: {
            isArchived: false,
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalLeads,
      leadsThisMonth,
      activeQuotations,
      completedSales,
      pendingTasks,
      overdueTasks,
    });
  } catch (error) {
    console.error("[DASHBOARD_METRICS]", error);
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 }
    );
  }
}
