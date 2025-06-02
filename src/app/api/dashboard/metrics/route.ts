import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getScope_user } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import type { DashboardMetricsResponse } from "@/types/metric-card";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const leadsScope = getScope_user(currentUser, "leads", "view");
    const tasksScope = getScope_user(currentUser, "tasks", "view");
    const salesScope = getScope_user(currentUser, "sales", "view");

    // Filtros para leads
    const leadFilters: any = {};
    if (leadsScope === "self") {
      leadFilters.assignedToId = currentUser.id;
    } else if (leadsScope === "team" && currentUser.countryId) {
      leadFilters.assignedTo = {
        countryId: currentUser.countryId,
      };
    }

    // Filtros para tareas
    const taskFilters: any = {};
    if (tasksScope === "self") {
      taskFilters.assignedToId = currentUser.id;
    } else if (tasksScope === "team" && currentUser.countryId) {
      taskFilters.lead = {
        assignedTo: { countryId: currentUser.countryId },
      };
    }

    // Filtros para ventas y relacionados
    const quotationFilters: any = {};
    const saleFilters: any = {};

    if (salesScope === "self") {
      // Filtramos por leads asignados al usuario actual
      quotationFilters.lead = { assignedToId: currentUser.id };
      saleFilters.lead = { assignedToId: currentUser.id };
    } else if (salesScope === "team" && currentUser.countryId) {
      quotationFilters.lead = {
        assignedTo: { countryId: currentUser.countryId },
      };
      saleFilters.lead = { assignedTo: { countryId: currentUser.countryId } };
    }

    const [
      totalLeads,
      newLeads,
      pendingTasks,
      quotations,
      sales,
      reservations,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          ...leadFilters,
          isArchived: false,
          qualification: { not: "BAD_LEAD" },
        },
      }),
      prisma.lead.count({
        where: {
          ...leadFilters,
          isArchived: false,
          qualification: { not: "BAD_LEAD" },
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      prisma.task.count({
        where: {
          ...taskFilters,
          status: "PENDING",
          lead: {
            isArchived: false,
            qualification: { not: "BAD_LEAD" },
            ...(tasksScope !== "all" && tasksScope !== false
              ? leadFilters
              : {}),
          },
        },
      }),
      prisma.quotation.count({
        where: {
          ...quotationFilters,
          lead: {
            isArchived: false,
            qualification: { not: "BAD_LEAD" },
          },
        },
      }),
      prisma.sale.count({
        where: {
          ...saleFilters,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          lead: {
            isArchived: false,
            qualification: { not: "BAD_LEAD" },
          },
        },
      }),
      prisma.reservation.count({
        where: {
          ...saleFilters,
          lead: {
            isArchived: false,
            qualification: { not: "BAD_LEAD" },
          },
        },
      }),
    ]);

    const responseData: DashboardMetricsResponse = {
      totalLeads,
      newLeads,
      pendingTasks,
      quotations,
      sales,
      reservations,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("[DASHBOARD_METRICS_API]", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener métricas del dashboard" },
      { status: 500 }
    );
  }
}
