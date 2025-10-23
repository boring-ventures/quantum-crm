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
          distribution: [],
          stats: {
            balanced: 0,
            overloaded: 0,
            underutilized: 0,
            avgWorkload: 0,
            totalWorkload: 0,
          },
        },
      });
    }

    const userIds_list = teamMembers.map((u) => u.id);

    // OPTIMIZED: Single query for active leads per user
    const activeLeadsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        active_leads: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          assigned_to_id,
          COUNT(*) as active_leads
        FROM leads
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND is_closed = false
          AND is_archived = false
        GROUP BY assigned_to_id
      `
    );

    // OPTIMIZED: Single query for pending tasks per user
    const pendingTasksStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        pending_tasks: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          assigned_to_id,
          COUNT(*) as pending_tasks
        FROM tasks
        WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
          AND status IN ('PENDING', 'IN_PROGRESS')
        GROUP BY assigned_to_id
      `
    );

    // Build lookup maps
    const leadsMap = new Map(activeLeadsStats.map((s) => [s.assigned_to_id, s]));
    const tasksMap = new Map(pendingTasksStats.map((s) => [s.assigned_to_id, s]));

    // Build workload data
    const workloadData = teamMembers.map((user) => {
      const leads = leadsMap.get(user.id);
      const tasks = tasksMap.get(user.id);

      const activeLeads = Number(leads?.active_leads || 0);
      const pendingTasks = Number(tasks?.pending_tasks || 0);
      const workloadScore = activeLeads * 1.0 + pendingTasks * 0.5;

      return {
        userId: user.id,
        name: user.name,
        activeLeads,
        pendingTasks,
        workloadScore: Number(workloadScore.toFixed(2)),
      };
    });

    // Calculate total workload
    const totalWorkload = workloadData.reduce(
      (sum, item) => sum + item.workloadScore,
      0
    );

    // Calculate percentage for each user
    const distributionWithPercentage = workloadData.map((item) => ({
      ...item,
      percentage:
        totalWorkload > 0
          ? Number(((item.workloadScore / totalWorkload) * 100).toFixed(2))
          : 0,
    }));

    // Sort by workload score descending
    distributionWithPercentage.sort((a, b) => b.workloadScore - a.workloadScore);

    // Calculate statistics
    const avgWorkload =
      teamMembers.length > 0
        ? totalWorkload / teamMembers.length
        : 0;

    const threshold = {
      overloaded: avgWorkload * 1.3,
      underutilized: avgWorkload * 0.7,
    };

    let balanced = 0;
    let overloaded = 0;
    let underutilized = 0;

    distributionWithPercentage.forEach((item) => {
      if (item.workloadScore >= threshold.overloaded) {
        overloaded++;
      } else if (item.workloadScore <= threshold.underutilized) {
        underutilized++;
      } else {
        balanced++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        distribution: distributionWithPercentage,
        stats: {
          balanced,
          overloaded,
          underutilized,
          avgWorkload: Number(avgWorkload.toFixed(2)),
          totalWorkload: Number(totalWorkload.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching team workload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener distribución de carga",
      },
      { status: 500 }
    );
  }
}
