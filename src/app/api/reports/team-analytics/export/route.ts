import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";
import * as XLSX from "xlsx";
import {
  formatTeamPerformanceForExport,
  formatTeamTimelineForExport,
  formatTeamWorkloadForExport,
  formatTeamFunnelForExport,
  formatTeamActivityForExport,
  formatTeamOverviewForExport,
} from "@/lib/utils/team-export-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const countryIds = searchParams
      .get("countryIds")
      ?.split(",")
      .filter(Boolean);
    const userIds = searchParams.get("userIds")?.split(",").filter(Boolean);
    const roleFilter = searchParams.get("role");

    // Default to last 30 days
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(subDays(defaultEndDate, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Build user filter
    const userWhere: any = {
      isActive: true,
      isDeleted: false,
    };

    if (countryIds?.length) {
      userWhere.countryId = { in: countryIds };
    }

    if (userIds?.length) {
      userWhere.id = { in: userIds };
    }

    if (roleFilter) {
      userWhere.role = roleFilter;
    }

    // Get all team members
    const teamMembers = await prisma.user.findMany({
      where: userWhere,
      include: {
        country: true,
      },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontraron miembros del equipo con los filtros aplicados",
        },
        { status: 400 }
      );
    }

    // Fetch all analytics data
    const userIds_list = teamMembers.map((u) => u.id);

    // 1. Performance data
    const performanceData = await Promise.all(
      teamMembers.map(async (user) => {
        const totalLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const qualifiedLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            qualification: "GOOD_LEAD",
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const convertedLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            isClosed: true,
            closureReason: { status: "WON" },
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const totalQuotations = await prisma.quotation.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const totalReservations = await prisma.reservation.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const totalSales = await prisma.sale.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
            approvalStatus: "APPROVED",
          },
        });

        const salesRevenue = await prisma.sale.groupBy({
          by: ["currency"],
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
            approvalStatus: "APPROVED",
          },
          _sum: { totalAmount: true },
        });

        const totalRevenue = {
          BOB: 0,
          USD: 0,
          USDT: 0,
        };

        salesRevenue.forEach((item) => {
          if (item.currency && item._sum.totalAmount) {
            totalRevenue[item.currency as keyof typeof totalRevenue] =
              Number(item._sum.totalAmount);
          }
        });

        const activeTasks = await prisma.task.count({
          where: {
            assignedToId: user.id,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        });

        const completedTasks = await prisma.task.count({
          where: {
            assignedToId: user.id,
            status: "COMPLETED",
            completedAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const comments = await prisma.leadComment.findMany({
          where: {
            userId: user.id,
            createdAt: { gte: periodStart, lte: periodEnd },
            isDeleted: false,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        });

        let avgResponseTime = 0;
        if (comments.length >= 2) {
          const intervals = [];
          for (let i = 1; i < comments.length; i++) {
            const diff =
              comments[i].createdAt.getTime() -
              comments[i - 1].createdAt.getTime();
            intervals.push(diff / (1000 * 60 * 60));
          }
          avgResponseTime =
            intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        }

        const totalComments = comments.length;
        const conversionRate =
          totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        return {
          userId: user.id,
          name: user.name || "N/A",
          email: user.email,
          country: user.country?.name || "N/A",
          totalLeads,
          qualifiedLeads,
          convertedLeads,
          conversionRate,
          totalQuotations,
          totalReservations,
          totalSales,
          totalRevenue,
          activeTasks,
          completedTasks,
          avgResponseTime,
          totalComments,
        };
      })
    );

    // 2. Timeline data (daily for last 30 days)
    const timelineData: any[] = [];
    const days = Math.min(
      30,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    );

    for (let i = 0; i < days; i++) {
      const date = new Date(periodStart);
      date.setDate(date.getDate() + i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const newLeads = await prisma.lead.count({
        where: {
          assignedToId: { in: userIds_list },
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const convertedLeads = await prisma.lead.count({
        where: {
          assignedToId: { in: userIds_list },
          isClosed: true,
          closureReason: { status: "WON" },
          closedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const tasksCreated = await prisma.task.count({
        where: {
          assignedToId: { in: userIds_list },
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const tasksCompleted = await prisma.task.count({
        where: {
          assignedToId: { in: userIds_list },
          status: "COMPLETED",
          completedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const activeMembers = await prisma.user.count({
        where: {
          id: { in: userIds_list },
          OR: [
            {
              assignedLeads: {
                some: {
                  createdAt: { gte: dayStart, lte: dayEnd },
                },
              },
            },
            {
              tasks: {
                some: {
                  OR: [
                    { createdAt: { gte: dayStart, lte: dayEnd } },
                    { completedAt: { gte: dayStart, lte: dayEnd } },
                  ],
                },
              },
            },
          ],
        },
      });

      const salesRevenue = await prisma.sale.aggregate({
        where: {
          lead: { assignedToId: { in: userIds_list } },
          createdAt: { gte: dayStart, lte: dayEnd },
          approvalStatus: "APPROVED",
        },
        _sum: { totalAmount: true },
      });

      timelineData.push({
        date: date.toISOString().split("T")[0],
        dateValue: date.toISOString(),
        newLeads,
        convertedLeads,
        tasksCreated,
        tasksCompleted,
        activeMembers,
        totalRevenue: Number(salesRevenue._sum.totalAmount || 0),
      });
    }

    // 3. Workload data
    const workloadData = await Promise.all(
      teamMembers.map(async (user) => {
        const activeLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            isClosed: false,
            isArchived: false,
          },
        });

        const pendingTasks = await prisma.task.count({
          where: {
            assignedToId: user.id,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        });

        const workloadScore = activeLeads * 1.0 + pendingTasks * 0.5;

        return {
          userId: user.id,
          name: user.name || "N/A",
          activeLeads,
          pendingTasks,
          workloadScore,
          percentage: 0,
        };
      })
    );

    const totalWorkload = workloadData.reduce((sum, item) => sum + item.workloadScore, 0);
    workloadData.forEach((item) => {
      item.percentage = totalWorkload > 0 ? (item.workloadScore / totalWorkload) * 100 : 0;
    });

    // 4. Funnel data
    const funnelData = await Promise.all(
      teamMembers.map(async (user) => {
        const totalLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const qualifiedLeads = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            qualification: "GOOD_LEAD",
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const quotations = await prisma.quotation.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const reservations = await prisma.reservation.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const sales = await prisma.sale.count({
          where: {
            lead: { assignedToId: user.id },
            createdAt: { gte: periodStart, lte: periodEnd },
            approvalStatus: "APPROVED",
          },
        });

        return {
          userId: user.id,
          name: user.name || "N/A",
          stages: {
            leads: totalLeads,
            qualified: qualifiedLeads,
            quotations,
            reservations,
            sales,
          },
          conversionRates: {
            leadToQualified: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
            qualifiedToQuotation: qualifiedLeads > 0 ? (quotations / qualifiedLeads) * 100 : 0,
            quotationToReservation: quotations > 0 ? (reservations / quotations) * 100 : 0,
            reservationToSale: reservations > 0 ? (sales / reservations) * 100 : 0,
          },
        };
      })
    );

    // 5. Activity data
    const activityData = await Promise.all(
      teamMembers.map(async (user) => {
        const totalComments = await prisma.leadComment.count({
          where: {
            userId: user.id,
            createdAt: { gte: periodStart, lte: periodEnd },
            isDeleted: false,
          },
        });

        const totalTasksCompleted = await prisma.task.count({
          where: {
            assignedToId: user.id,
            status: "COMPLETED",
            completedAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const lastComment = await prisma.leadComment.findFirst({
          where: {
            userId: user.id,
            isDeleted: false,
          },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        const daysInPeriod = Math.ceil(
          (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        const avgDailyActivity =
          daysInPeriod > 0
            ? (totalComments + totalTasksCompleted) / daysInPeriod
            : 0;

        const activityScore = totalComments * 1 + totalTasksCompleted * 2;

        return {
          userId: user.id,
          name: user.name || "N/A",
          totalComments,
          totalTasksCompleted,
          avgDailyActivity,
          lastActivityDate: lastComment ? lastComment.createdAt.toISOString() : "N/A",
          activityScore,
        };
      })
    );

    // 6. Overview data
    const totalLeadsAll = performanceData.reduce((sum, item) => sum + item.totalLeads, 0);
    const totalConvertedLeadsAll = performanceData.reduce((sum, item) => sum + item.convertedLeads, 0);
    const avgConversionRate =
      teamMembers.length > 0
        ? performanceData.reduce((sum, item) => sum + item.conversionRate, 0) / teamMembers.length
        : 0;
    const avgResponseTime =
      teamMembers.length > 0
        ? performanceData.reduce((sum, item) => sum + item.avgResponseTime, 0) / teamMembers.length
        : 0;

    const totalTeamRevenue = performanceData.reduce(
      (sum, item) => sum + item.totalRevenue.BOB + item.totalRevenue.USD + item.totalRevenue.USDT,
      0
    );

    const totalTasks = performanceData.reduce(
      (sum, item) => sum + item.activeTasks + item.completedTasks,
      0
    );
    const completedTasks = performanceData.reduce((sum, item) => sum + item.completedTasks, 0);
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const topPerformer = performanceData.reduce((best, current) => {
      return current.totalSales > (best?.totalSales || 0) ? current : best;
    }, null as any);

    const leadCounts = performanceData.map((item) => item.totalLeads);
    const avgLeadsPerSeller = leadCounts.length > 0 ? leadCounts.reduce((sum, val) => sum + val, 0) / leadCounts.length : 0;
    const maxLeads = leadCounts.length > 0 ? Math.max(...leadCounts) : 0;
    const minLeads = leadCounts.length > 0 ? Math.min(...leadCounts) : 0;

    const overviewData = {
      overview: {
        totalTeamMembers: teamMembers.length,
        activeMembers: teamMembers.length,
        avgConversionRate,
        avgResponseTime,
        totalTeamRevenue,
        totalLeads: totalLeadsAll,
        totalConvertedLeads: totalConvertedLeadsAll,
        totalTasks,
        completedTasks,
        taskCompletionRate,
      },
      topPerformer: topPerformer
        ? {
            userId: topPerformer.userId,
            name: topPerformer.name,
            totalSales: topPerformer.totalSales,
            conversionRate: topPerformer.conversionRate,
          }
        : null,
      workloadStats: {
        avgLeadsPerSeller,
        maxLeads,
        minLeads,
      },
    };

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["TEAM ANALYTICS - RESUMEN"],
      [""],
      ["Período:", `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`],
      ["Generado:", new Date().toLocaleString()],
      [""],
      ...formatTeamOverviewForExport(overviewData).map((item) => [item.Métrica, item.Valor]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

    // Performance sheet
    const performanceSheet = XLSX.utils.json_to_sheet(
      formatTeamPerformanceForExport(performanceData)
    );
    XLSX.utils.book_append_sheet(workbook, performanceSheet, "Performance");

    // Timeline sheet
    const timelineSheet = XLSX.utils.json_to_sheet(
      formatTeamTimelineForExport(timelineData)
    );
    XLSX.utils.book_append_sheet(workbook, timelineSheet, "Timeline");

    // Workload sheet
    const workloadSheet = XLSX.utils.json_to_sheet(
      formatTeamWorkloadForExport(workloadData)
    );
    XLSX.utils.book_append_sheet(workbook, workloadSheet, "Carga de Trabajo");

    // Funnel sheet
    const funnelSheet = XLSX.utils.json_to_sheet(
      formatTeamFunnelForExport(funnelData)
    );
    XLSX.utils.book_append_sheet(workbook, funnelSheet, "Embudo");

    // Activity sheet
    const activitySheet = XLSX.utils.json_to_sheet(
      formatTeamActivityForExport(activityData)
    );
    XLSX.utils.book_append_sheet(workbook, activitySheet, "Actividad");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const fileName = `team_analytics_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error exporting team analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al exportar team analytics",
      },
      { status: 500 }
    );
  }
}
