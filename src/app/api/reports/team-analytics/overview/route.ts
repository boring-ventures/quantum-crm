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

    // Get all team members
    const teamMembers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
      },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalTeamMembers: 0,
            activeMembers: 0,
            avgConversionRate: 0,
            avgResponseTime: 0,
            totalTeamRevenue: 0,
            totalLeads: 0,
            totalConvertedLeads: 0,
            totalTasks: 0,
            completedTasks: 0,
            taskCompletionRate: 0,
          },
          topPerformer: null,
          workloadStats: {
            avgLeadsPerSeller: 0,
            maxLeads: 0,
            minLeads: 0,
          },
        },
      });
    }

    const userIds_list = teamMembers.map((u) => u.id);

    // OPTIMIZED: Single query for all lead stats
    const leadsStats = await prisma.$queryRaw<
      Array<{
        total_leads: bigint;
        converted_leads: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          COUNT(*) as total_leads,
          COUNT(CASE WHEN is_closed = true AND converted_at IS NOT NULL THEN 1 END) as converted_leads
        FROM leads
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
      `
    );

    const totalLeads = Number(leadsStats[0]?.total_leads || 0);
    const totalConvertedLeads = Number(leadsStats[0]?.converted_leads || 0);

    // OPTIMIZED: Single query for revenue
    const revenueStats = await prisma.$queryRaw<
      Array<{
        total_revenue: string;
      }>
    >(
      Prisma.sql`
        SELECT
          COALESCE(SUM(s.amount), 0)::text as total_revenue
        FROM sales s
        INNER JOIN leads l ON s.lead_id = l.id
        WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
          AND s.created_at >= ${periodStart}
          AND s.created_at <= ${periodEnd}
          AND s.approval_status = 'APPROVED'
      `
    );

    const totalTeamRevenue = parseFloat(revenueStats[0]?.total_revenue || "0");

    // OPTIMIZED: Single query for task stats
    const tasksStats = await prisma.$queryRaw<
      Array<{
        total_tasks: bigint;
        completed_tasks: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks
        FROM tasks
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
      `
    );

    const totalTasks = Number(tasksStats[0]?.total_tasks || 0);
    const completedTasks = Number(tasksStats[0]?.completed_tasks || 0);
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // OPTIMIZED: Calculate conversion rate per user in single query
    const conversionStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_leads: bigint;
        converted_leads: bigint;
        conversion_rate: number;
      }>
    >(
      Prisma.sql`
        SELECT
          assigned_to_id,
          COUNT(*) as total_leads,
          COUNT(CASE WHEN is_closed = true AND converted_at IS NOT NULL THEN 1 END) as converted_leads,
          CASE
            WHEN COUNT(*) > 0 THEN
              (COUNT(CASE WHEN is_closed = true AND converted_at IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100)
            ELSE 0
          END as conversion_rate
        FROM leads
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
        GROUP BY assigned_to_id
      `
    );

    const avgConversionRate =
      conversionStats.length > 0
        ? conversionStats.reduce((sum, s) => sum + Number(s.conversion_rate), 0) / conversionStats.length
        : 0;

    // OPTIMIZED: Calculate response time per user
    const responseTimeStats = await prisma.$queryRaw<
      Array<{
        user_id: string;
        avg_response_hours: number;
      }>
    >(
      Prisma.sql`
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

    const avgResponseTime =
      responseTimeStats.length > 0
        ? responseTimeStats.reduce((sum, s) => sum + Number(s.avg_response_hours || 0), 0) / responseTimeStats.length
        : 0;

    // OPTIMIZED: Top performer by total sales revenue
    const topPerformerStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_sales: bigint;
        total_revenue: string;
        conversion_rate: number;
      }>
    >(
      Prisma.sql`
        SELECT
          l.assigned_to_id,
          COUNT(s.id) as total_sales,
          SUM(s.amount)::text as total_revenue,
          COALESCE(
            (SELECT
              CASE
                WHEN COUNT(*) > 0 THEN
                  (COUNT(CASE WHEN is_closed = true AND converted_at IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100)
                ELSE 0
              END
            FROM leads
            WHERE assigned_to_id = l.assigned_to_id
              AND created_at >= ${periodStart}
              AND created_at <= ${periodEnd}
            ), 0
          ) as conversion_rate
        FROM sales s
        INNER JOIN leads l ON s.lead_id = l.id
        WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
          AND s.created_at >= ${periodStart}
          AND s.created_at <= ${periodEnd}
          AND s.approval_status = 'APPROVED'
        GROUP BY l.assigned_to_id
        ORDER BY total_revenue DESC
        LIMIT 1
      `
    );

    let topPerformer = null;
    if (topPerformerStats.length > 0) {
      const topStat = topPerformerStats[0];
      const topUser = teamMembers.find((u) => u.id === topStat.assigned_to_id);
      if (topUser) {
        topPerformer = {
          userId: topUser.id,
          name: topUser.name,
          totalSales: parseFloat(topStat.total_revenue),
          conversionRate: Number(topStat.conversion_rate),
        };
      }
    }

    // OPTIMIZED: Workload statistics in single query
    const workloadStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        lead_count: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          assigned_to_id,
          COUNT(*) as lead_count
        FROM leads
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND is_closed = false
          AND is_archived = false
        GROUP BY assigned_to_id
      `
    );

    const leadCounts = workloadStats.map((s) => Number(s.lead_count));
    const avgLeadsPerSeller =
      leadCounts.length > 0
        ? leadCounts.reduce((sum, count) => sum + count, 0) / leadCounts.length
        : 0;
    const maxLeads = leadCounts.length > 0 ? Math.max(...leadCounts) : 0;
    const minLeads = leadCounts.length > 0 ? Math.min(...leadCounts) : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTeamMembers: teamMembers.length,
          activeMembers: teamMembers.length,
          avgConversionRate: Number(avgConversionRate.toFixed(2)),
          avgResponseTime: Number(avgResponseTime.toFixed(2)),
          totalTeamRevenue: Number(totalTeamRevenue.toFixed(2)),
          totalLeads,
          totalConvertedLeads,
          totalTasks,
          completedTasks,
          taskCompletionRate: Number(taskCompletionRate.toFixed(2)),
        },
        topPerformer,
        workloadStats: {
          avgLeadsPerSeller: Number(avgLeadsPerSeller.toFixed(2)),
          maxLeads,
          minLeads,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching team analytics overview:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener overview del equipo",
      },
      { status: 500 }
    );
  }
}
