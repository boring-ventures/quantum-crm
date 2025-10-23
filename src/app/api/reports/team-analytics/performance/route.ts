import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

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

    // Get all team members with country info
    const teamMembers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        country: {
          select: { name: true },
        },
      },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          performance: [],
        },
      });
    }

    const userIds_list = teamMembers.map((u) => u.id);

    // Use raw SQL for optimized aggregation - THIS IS THE KEY OPTIMIZATION
    const leadsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_leads: bigint;
        qualified_leads: bigint;
        converted_leads: bigint;
      }>
    >(Prisma.sql`
      SELECT
        assigned_to_id,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN qualification = 'GOOD_LEAD' THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN is_closed = true AND converted_at IS NOT NULL THEN 1 END) as converted_leads
      FROM leads
      WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
      GROUP BY assigned_to_id
    `
    );

    // Quotations count
    const quotationsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_quotations: bigint;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(q.id) as total_quotations
      FROM quotations q
      INNER JOIN leads l ON q.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND q.created_at >= ${periodStart}
        AND q.created_at <= ${periodEnd}
      GROUP BY l.assigned_to_id
    `
    );

    // Reservations count
    const reservationsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_reservations: bigint;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(r.id) as total_reservations
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND r.created_at >= ${periodStart}
        AND r.created_at <= ${periodEnd}
      GROUP BY l.assigned_to_id
    `
    );

    // Sales count and revenue by currency
    const salesStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_sales: bigint;
        currency: string;
        total_revenue: string;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(s.id) as total_sales,
        s.currency,
        SUM(s.amount)::text as total_revenue
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND s.created_at >= ${periodStart}
        AND s.created_at <= ${periodEnd}
        AND s.approval_status = 'APPROVED'
      GROUP BY l.assigned_to_id, s.currency
    `
    );

    // Tasks stats
    const tasksStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        active_tasks: bigint;
        completed_tasks: bigint;
      }>
    >(Prisma.sql`
      SELECT
        assigned_to_id,
        COUNT(CASE WHEN status IN ('PENDING', 'IN_PROGRESS') THEN 1 END) as active_tasks,
        COUNT(CASE WHEN status = 'COMPLETED'
          AND completed_at >= ${periodStart}
          AND completed_at <= ${periodEnd} THEN 1 END) as completed_tasks
      FROM tasks
      WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
      GROUP BY assigned_to_id
    `
    );

    // Comments count
    const commentsStats = await prisma.$queryRaw<
      Array<{
        user_id: string;
        total_comments: bigint;
      }>
    >(Prisma.sql`
      SELECT
        user_id,
        COUNT(*) as total_comments
      FROM lead_comments
      WHERE user_id IN (${Prisma.join(userIds_list)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
        AND is_deleted = false
      GROUP BY user_id
    `
    );

    // Average response time (approximate - simplified)
    const responseTimeStats = await prisma.$queryRaw<
      Array<{
        user_id: string;
        avg_response_hours: number;
      }>
    >(Prisma.sql`
      WITH comment_intervals AS (
        SELECT
          user_id,
          created_at,
          LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_created_at
        FROM lead_comments
        WHERE user_id IN (${Prisma.join(userIds_list)})
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
          AND is_deleted = false
      )
      SELECT
        user_id,
        AVG(EXTRACT(EPOCH FROM (created_at - prev_created_at)) / 3600)::numeric as avg_response_hours
      FROM comment_intervals
      WHERE prev_created_at IS NOT NULL
      GROUP BY user_id
    `
    );

    // Convert to lookup maps for O(1) access
    const leadsMap = new Map(leadsStats.map((s) => [s.assigned_to_id, s]));
    const quotationsMap = new Map(quotationsStats.map((s) => [s.assigned_to_id, s]));
    const reservationsMap = new Map(reservationsStats.map((s) => [s.assigned_to_id, s]));
    const tasksMap = new Map(tasksStats.map((s) => [s.assigned_to_id, s]));
    const commentsMap = new Map(commentsStats.map((s) => [s.user_id, s]));
    const responseTimeMap = new Map(responseTimeStats.map((s) => [s.user_id, s]));

    // Build sales map grouped by user and currency
    const salesMap = new Map<string, Map<string, { count: number; revenue: number }>>();
    salesStats.forEach((s) => {
      if (!salesMap.has(s.assigned_to_id)) {
        salesMap.set(s.assigned_to_id, new Map());
      }
      const userSales = salesMap.get(s.assigned_to_id)!;
      userSales.set(s.currency, {
        count: Number(s.total_sales),
        revenue: parseFloat(s.total_revenue),
      });
    });

    // Build performance array
    const performanceData = teamMembers.map((user) => {
      const leads = leadsMap.get(user.id);
      const quotations = quotationsMap.get(user.id);
      const reservations = reservationsMap.get(user.id);
      const tasks = tasksMap.get(user.id);
      const comments = commentsMap.get(user.id);
      const responseTime = responseTimeMap.get(user.id);
      const userSales = salesMap.get(user.id);

      const totalLeads = Number(leads?.total_leads || 0);
      const qualifiedLeads = Number(leads?.qualified_leads || 0);
      const convertedLeads = Number(leads?.converted_leads || 0);

      // Calculate total sales across all currencies
      let totalSales = 0;
      if (userSales) {
        userSales.forEach((data) => {
          totalSales += data.count;
        });
      }

      const totalRevenue = {
        BOB: userSales?.get("BOB")?.revenue || 0,
        USD: userSales?.get("USD")?.revenue || 0,
        USDT: userSales?.get("USDT")?.revenue || 0,
      };

      return {
        userId: user.id,
        name: user.name || "N/A",
        email: user.email,
        country: user.country?.name || "N/A",
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        totalQuotations: Number(quotations?.total_quotations || 0),
        totalReservations: Number(reservations?.total_reservations || 0),
        totalSales,
        totalRevenue,
        activeTasks: Number(tasks?.active_tasks || 0),
        completedTasks: Number(tasks?.completed_tasks || 0),
        avgResponseTime: Number(responseTime?.avg_response_hours || 0),
        totalComments: Number(comments?.total_comments || 0),
      };
    });

    // Sort by total sales descending
    performanceData.sort((a, b) => b.totalSales - a.totalSales);

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceData,
      },
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener performance del equipo",
      },
      { status: 500 }
    );
  }
}
