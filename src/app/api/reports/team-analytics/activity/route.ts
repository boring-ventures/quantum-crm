import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";

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

    // Calculate days in period
    const daysInPeriod = differenceInDays(periodEnd, periodStart) + 1;

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
          activity: [],
          teamActivity: {
            totalComments: 0,
            totalInteractions: 0,
            mostActiveDay: "N/A",
            avgCommentsPerUser: 0,
          },
        },
      });
    }

    const userIds_list = teamMembers.map((u) => u.id);

    // OPTIMIZED: Single query for all comments counts per user
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

    // OPTIMIZED: Single query for completed tasks per user
    const tasksStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        tasks_completed: bigint;
      }>
    >(Prisma.sql`
      SELECT
        assigned_to_id,
        COUNT(*) as tasks_completed
      FROM tasks
      WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
        AND status = 'COMPLETED'
        AND completed_at >= ${periodStart}
        AND completed_at <= ${periodEnd}
      GROUP BY assigned_to_id
    `
    );

    // OPTIMIZED: Single query for last activity date per user
    const lastActivityStats = await prisma.$queryRaw<
      Array<{
        user_id: string;
        last_activity: Date;
      }>
    >(Prisma.sql`
      SELECT
        user_id,
        MAX(created_at) as last_activity
      FROM lead_comments
      WHERE user_id IN (${Prisma.join(userIds_list)})
        AND is_deleted = false
      GROUP BY user_id
    `
    );

    // Build lookup maps
    const commentsMap = new Map(commentsStats.map((s) => [s.user_id, s]));
    const tasksMap = new Map(tasksStats.map((s) => [s.assigned_to_id, s]));
    const lastActivityMap = new Map(lastActivityStats.map((s) => [s.user_id, s]));

    // Build activity data array
    const activityData = teamMembers.map((user) => {
      const comments = commentsMap.get(user.id);
      const tasks = tasksMap.get(user.id);
      const lastActivity = lastActivityMap.get(user.id);

      const totalComments = Number(comments?.total_comments || 0);
      const totalTasksCompleted = Number(tasks?.tasks_completed || 0);

      const avgDailyActivity =
        daysInPeriod > 0
          ? Number(((totalComments + totalTasksCompleted) / daysInPeriod).toFixed(2))
          : 0;

      const activityScore = totalComments * 1 + totalTasksCompleted * 2;

      const lastActivityDate = lastActivity?.last_activity
        ? lastActivity.last_activity.toISOString()
        : "N/A";

      return {
        userId: user.id,
        name: user.name,
        totalComments,
        totalTasksCompleted,
        avgDailyActivity,
        lastActivityDate,
        activityScore,
      };
    });

    // Sort by activity score descending
    activityData.sort((a, b) => b.activityScore - a.activityScore);

    // Calculate team-wide metrics
    const totalTeamComments = activityData.reduce(
      (sum, item) => sum + item.totalComments,
      0
    );

    const totalTeamTasks = activityData.reduce(
      (sum, item) => sum + item.totalTasksCompleted,
      0
    );

    const totalInteractions = totalTeamComments + totalTeamTasks;

    const avgCommentsPerUser =
      teamMembers.length > 0
        ? Number((totalTeamComments / teamMembers.length).toFixed(2))
        : 0;

    // OPTIMIZED: Find most active day - single query
    const mostActiveDayStats = await prisma.$queryRaw<
      Array<{
        activity_date: Date;
        activity_count: bigint;
      }>
    >(Prisma.sql`
      WITH all_activities AS (
        SELECT DATE(created_at) as activity_date
        FROM lead_comments
        WHERE user_id IN (${Prisma.join(userIds_list)})
          AND created_at >= ${periodStart}
          AND created_at <= ${periodEnd}
          AND is_deleted = false
        UNION ALL
        SELECT DATE(completed_at) as activity_date
        FROM tasks
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND completed_at >= ${periodStart}
          AND completed_at <= ${periodEnd}
          AND status = 'COMPLETED'
      )
      SELECT
        activity_date,
        COUNT(*) as activity_count
      FROM all_activities
      WHERE activity_date IS NOT NULL
      GROUP BY activity_date
      ORDER BY activity_count DESC
      LIMIT 1
    `
    );

    const mostActiveDay =
      mostActiveDayStats.length > 0 && mostActiveDayStats[0]?.activity_date
        ? mostActiveDayStats[0].activity_date.toISOString().split("T")[0]
        : "N/A";

    return NextResponse.json({
      success: true,
      data: {
        activity: activityData,
        teamActivity: {
          totalComments: totalTeamComments,
          totalInteractions,
          mostActiveDay,
          avgCommentsPerUser,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener actividad del equipo",
      },
      { status: 500 }
    );
  }
}
