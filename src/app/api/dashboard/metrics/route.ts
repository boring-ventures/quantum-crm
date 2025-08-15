import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getScope_user } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import type { DashboardMetricsResponse } from "@/types/metric-card";

export async function POST(req: Request) {
  try {
    console.log("[DASHBOARD_METRICS] Iniciando obtención de métricas");

    // Leer el body de la request si existe
    let requestBody = null;
    try {
      requestBody = await req.json();
      console.log("[DASHBOARD_METRICS] Request body:", requestBody);
    } catch (e) {
      console.log(
        "[DASHBOARD_METRICS] No hay body en la request o error al parsear"
      );
    }

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

    // Filtros para leads - excluir cerrados y archivados de métricas
    const leadFilters: any = {
      isArchived: false,
      isClosed: false,
    };

    if (leadsScope === "self") {
      leadFilters.assignedToId = currentUser.id;
    } else if (leadsScope === "team" && currentUser.countryId) {
      leadFilters.assignedTo = {
        countryId: currentUser.countryId,
      };
    }

    // Filtros para tareas - solo contar tareas pendientes hasta hoy
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Hasta el final del día de hoy
    
    const taskFilters: any = {
      status: "PENDING",
      OR: [
        { scheduledFor: { lte: today } }, // Tareas programadas para hoy o antes
        { scheduledFor: null } // Tareas sin fecha programada
      ],
      lead: {
        isArchived: false,
        isClosed: false,
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
        isClosed: false,
      },
    };

    if (salesScope === "self") {
      quotationFilters.lead.assignedToId = currentUser.id;
    } else if (salesScope === "team" && currentUser.countryId) {
      quotationFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    // Filtros para sales (removemos temporalmente approvalStatus hasta verificar schema)
    const saleFilters: any = {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
      lead: {
        isArchived: false,
        isClosed: false,
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
        isClosed: false,
      },
    };

    if (salesScope === "self") {
      reservationFilters.lead.assignedToId = currentUser.id;
    } else if (salesScope === "team" && currentUser.countryId) {
      reservationFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    console.log("[DASHBOARD_METRICS] Ejecutando consultas de base de datos...");
    console.log("[DASHBOARD_METRICS] Filtros aplicados:", {
      leadFilters,
      taskFilters,
      quotationFilters,
      saleFilters,
      reservationFilters,
    });

    // Filtros adicionales para tareas de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTaskFilters: any = {
      status: "PENDING",
      OR: [
        { scheduledFor: { gte: todayStart, lte: todayEnd } },
        { 
          scheduledFor: null,
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      ],
      lead: {
        isArchived: false,
        isClosed: false,
      },
    };

    if (tasksScope === "self") {
      todayTaskFilters.assignedToId = currentUser.id;
    } else if (tasksScope === "team" && currentUser.countryId) {
      todayTaskFilters.lead.assignedTo = { countryId: currentUser.countryId };
    }

    let totalLeads, newLeads, pendingTasks, todayTasks, quotations, sales, reservations;

    try {
      // Debug: contar todos los leads sin filtros para comparar
      const allLeadsCount = await prisma.lead.count();
      const archivedLeadsCount = await prisma.lead.count({
        where: { isArchived: true },
      });
      const badLeadsCount = await prisma.lead.count({
        where: { qualification: "BAD_LEAD" },
      });

      console.log("[DASHBOARD_METRICS] Debug counts:", {
        allLeadsCount,
        archivedLeadsCount,
        badLeadsCount,
      });

      [totalLeads, newLeads, pendingTasks, todayTasks, quotations, sales, reservations] =
        await Promise.all([
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
          prisma.task.count({
            where: todayTaskFilters,
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
    } catch (dbError) {
      console.log("[DASHBOARD_METRICS] Error en consultas de base de datos:");
      console.log(
        "[DASHBOARD_METRICS] DB Error message:",
        dbError instanceof Error ? dbError.message : String(dbError)
      );
      throw dbError; // Re-throw para que sea capturado por el catch principal
    }

    console.log("[DASHBOARD_METRICS] Resultados de consultas:", {
      totalLeads,
      newLeads,
      pendingTasks,
      todayTasks,
      quotations,
      sales,
      reservations,
    });

    const responseData: DashboardMetricsResponse = {
      totalLeads,
      newLeads,
      pendingTasks,
      todayTasks,
      quotations,
      sales,
      reservations,
    };

    console.log("[DASHBOARD_METRICS] Retornando respuesta exitosa");
    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    // Manejo seguro de errores sin usar console.error problemático
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : "No stack available";

    // Usar console.log en lugar de console.error para evitar problemas
    console.log("[DASHBOARD_METRICS_API] Error occurred:");
    console.log("[DASHBOARD_METRICS_API] Error message:", errorMessage);
    console.log("[DASHBOARD_METRICS_API] Error stack:", errorStack);
    console.log("[DASHBOARD_METRICS_API] Error type:", typeof error);

    return NextResponse.json(
      { success: false, error: "Error al obtener métricas del dashboard" },
      { status: 500 }
    );
  }
}
