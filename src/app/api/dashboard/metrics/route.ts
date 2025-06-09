import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getScope_user } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import type { DashboardMetricsResponse } from "@/types/metric-card";

export async function POST(req: Request) {
  try {
    console.log("[DASHBOARD_METRICS] Iniciando obtención de métricas");

    const currentUser = await getCurrentUser();
    console.log(
      "[DASHBOARD_METRICS] Usuario actual:",
      currentUser?.id,
      currentUser?.email
    );

    if (!currentUser) {
      console.log("[DASHBOARD_METRICS] Usuario no autorizado");
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    console.log("[DASHBOARD_METRICS] Obteniendo scopes...");
    const leadsScope = getScope_user(currentUser, "leads", "view");
    const tasksScope = getScope_user(currentUser, "tasks", "view");
    const salesScope = getScope_user(currentUser, "sales", "view");

    console.log("[DASHBOARD_METRICS] Scopes obtenidos:", {
      leadsScope,
      tasksScope,
      salesScope,
    });

    // Filtros para leads
    const leadFilters: any = {
      isArchived: false,
      qualification: { not: "BAD_LEAD" },
    };

    if (leadsScope === "self") {
      leadFilters.assignedToId = currentUser.id;
    } else if (leadsScope === "team" && currentUser.countryId) {
      leadFilters.assignedTo = {
        countryId: currentUser.countryId,
      };
    }

    // Filtros para tareas
    const taskFilters: any = {
      status: "PENDING",
      lead: {
        isArchived: false,
        qualification: { not: "BAD_LEAD" },
      },
    };

    if (tasksScope === "self") {
      taskFilters.assignedToId = currentUser.id;
    } else if (tasksScope === "team" && currentUser.countryId) {
      taskFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    // Filtros para quotations
    const quotationFilters: any = {
      lead: {
        isArchived: false,
        qualification: { not: "BAD_LEAD" },
      },
    };

    if (salesScope === "self") {
      quotationFilters.lead.assignedToId = currentUser.id;
    } else if (salesScope === "team" && currentUser.countryId) {
      quotationFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    // Filtros para sales
    const saleFilters: any = {
      approvalStatus: "APPROVED", // Usar el campo correcto
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
      lead: {
        isArchived: false,
        qualification: { not: "BAD_LEAD" },
      },
    };

    if (salesScope === "self") {
      saleFilters.lead.assignedToId = currentUser.id;
    } else if (salesScope === "team" && currentUser.countryId) {
      saleFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    // Filtros para reservations
    const reservationFilters: any = {
      lead: {
        isArchived: false,
        qualification: { not: "BAD_LEAD" },
      },
    };

    if (salesScope === "self") {
      reservationFilters.lead.assignedToId = currentUser.id;
    } else if (salesScope === "team" && currentUser.countryId) {
      reservationFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    console.log("[DASHBOARD_METRICS] Ejecutando consultas de base de datos...");
    const [
      totalLeads,
      newLeads,
      pendingTasks,
      quotations,
      sales,
      reservations,
    ] = await Promise.all([
      prisma.lead.count({
        where: leadFilters,
      }),
      prisma.lead.count({
        where: {
          ...leadFilters,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      prisma.task.count({
        where: taskFilters,
      }),
      prisma.quotation.count({
        where: quotationFilters,
      }),
      prisma.sale.count({
        where: saleFilters,
      }),
      prisma.reservation.count({
        where: reservationFilters,
      }),
    ]);

    console.log("[DASHBOARD_METRICS] Resultados de consultas:", {
      totalLeads,
      newLeads,
      pendingTasks,
      quotations,
      sales,
      reservations,
    });

    const responseData: DashboardMetricsResponse = {
      totalLeads,
      newLeads,
      pendingTasks,
      quotations,
      sales,
      reservations,
    };

    console.log("[DASHBOARD_METRICS] Retornando respuesta exitosa");
    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("[DASHBOARD_METRICS_API] Error completo:", error);
    console.error(
      "[DASHBOARD_METRICS_API] Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      { success: false, error: "Error al obtener métricas del dashboard" },
      { status: 500 }
    );
  }
}
