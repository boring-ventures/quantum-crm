import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  subDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";

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
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

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

    // Get team member IDs
    const teamMembers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((u) => u.id);

    if (teamMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          timeline: [],
          period: {
            startDate: periodStart.toISOString(),
            endDate: periodEnd.toISOString(),
            groupBy,
          },
        },
      });
    }

    // Determine SQL date truncation based on groupBy
    let dateTrunc = "day";
    let dateFormat = "yyyy-MM-dd";

    switch (groupBy) {
      case "week":
        dateTrunc = "week";
        dateFormat = "yyyy-'W'II";
        break;
      case "month":
        dateTrunc = "month";
        dateFormat = "yyyy-MM";
        break;
      case "day":
      default:
        dateTrunc = "day";
        dateFormat = "yyyy-MM-dd";
        break;
    }

    // OPTIMIZED: Single query for new leads grouped by date
    const newLeadsStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        lead_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at) as period_date,
        COUNT(*) as lead_count
      FROM leads
      WHERE assigned_to_id IN (${Prisma.join(teamMemberIds)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at)
      ORDER BY period_date
    `
    );

    // OPTIMIZED: Single query for converted leads grouped by date
    const convertedLeadsStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        converted_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, l.created_at) as period_date,
        COUNT(DISTINCT l.id) as converted_count
      FROM leads l
      INNER JOIN sales s ON s.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(teamMemberIds)})
        AND l.created_at >= ${periodStart}
        AND l.created_at <= ${periodEnd}
        AND s.approval_status = 'APPROVED'
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, l.created_at)
      ORDER BY period_date
    `
    );

    // OPTIMIZED: Single query for tasks created grouped by date
    const tasksCreatedStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        task_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at) as period_date,
        COUNT(*) as task_count
      FROM tasks
      WHERE assigned_to_id IN (${Prisma.join(teamMemberIds)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at)
      ORDER BY period_date
    `
    );

    // OPTIMIZED: Single query for tasks completed grouped by date
    const tasksCompletedStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        completed_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, completed_at) as period_date,
        COUNT(*) as completed_count
      FROM tasks
      WHERE assigned_to_id IN (${Prisma.join(teamMemberIds)})
        AND status = 'COMPLETED'
        AND completed_at >= ${periodStart}
        AND completed_at <= ${periodEnd}
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, completed_at)
      ORDER BY period_date
    `
    );

    // OPTIMIZED: Single query for active members grouped by date
    const activeMembersStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        active_member_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at) as period_date,
        COUNT(DISTINCT user_id) as active_member_count
      FROM lead_comments
      WHERE user_id IN (${Prisma.join(teamMemberIds)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
        AND is_deleted = false
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, created_at)
      ORDER BY period_date
    `
    );

    // OPTIMIZED: Single query for revenue grouped by date
    const revenueStats = await prisma.$queryRaw<
      Array<{
        period_date: Date;
        total_revenue: string;
      }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, s.created_at) as period_date,
        SUM(s.amount)::text as total_revenue
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(teamMemberIds)})
        AND s.created_at >= ${periodStart}
        AND s.created_at <= ${periodEnd}
        AND s.approval_status = 'APPROVED'
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${dateTrunc}'`)}, s.created_at)
      ORDER BY period_date
    `
    );

    // Build lookup maps by date string for O(1) access
    const newLeadsMap = new Map(
      newLeadsStats.map((s) => [s.period_date.toISOString(), Number(s.lead_count)])
    );
    const convertedLeadsMap = new Map(
      convertedLeadsStats.map((s) => [s.period_date.toISOString(), Number(s.converted_count)])
    );
    const tasksCreatedMap = new Map(
      tasksCreatedStats.map((s) => [s.period_date.toISOString(), Number(s.task_count)])
    );
    const tasksCompletedMap = new Map(
      tasksCompletedStats.map((s) => [s.period_date.toISOString(), Number(s.completed_count)])
    );
    const activeMembersMap = new Map(
      activeMembersStats.map((s) => [s.period_date.toISOString(), Number(s.active_member_count)])
    );
    const revenueMap = new Map(
      revenueStats.map((s) => [s.period_date.toISOString(), parseFloat(s.total_revenue)])
    );

    // Generate date intervals
    let intervals: Date[] = [];

    switch (groupBy) {
      case "week":
        intervals = eachWeekOfInterval(
          { start: periodStart, end: periodEnd },
          { weekStartsOn: 1 }
        );
        break;
      case "month":
        intervals = eachMonthOfInterval({
          start: periodStart,
          end: periodEnd,
        });
        break;
      case "day":
      default:
        intervals = eachDayOfInterval({
          start: periodStart,
          end: periodEnd,
        });
        break;
    }

    // Build timeline data from intervals and lookup maps
    const timelineData = intervals.map((intervalStart) => {
      const dateKey = intervalStart.toISOString();

      return {
        date: format(intervalStart, dateFormat),
        dateValue: intervalStart.toISOString(),
        newLeads: newLeadsMap.get(dateKey) || 0,
        convertedLeads: convertedLeadsMap.get(dateKey) || 0,
        tasksCreated: tasksCreatedMap.get(dateKey) || 0,
        tasksCompleted: tasksCompletedMap.get(dateKey) || 0,
        activeMembers: activeMembersMap.get(dateKey) || 0,
        totalRevenue: revenueMap.get(dateKey) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        timeline: timelineData,
        period: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
          groupBy,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching team timeline:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener timeline del equipo",
      },
      { status: 500 }
    );
  }
}
