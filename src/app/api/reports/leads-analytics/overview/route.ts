import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    const sourceIds = searchParams.get("sourceIds")?.split(",").filter(Boolean);
    const assignedToIds = searchParams
      .get("assignedToIds")
      ?.split(",")
      .filter(Boolean);
    const leadCategory = searchParams.get("leadCategory");

    // Default to last 30 days if no dates provided
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(subDays(defaultEndDate, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Previous period for comparison (same duration)
    const periodDuration = Math.abs(
      periodEnd.getTime() - periodStart.getTime()
    );
    const previousPeriodEnd = new Date(periodStart.getTime() - 1);
    const previousPeriodStart = new Date(
      previousPeriodEnd.getTime() - periodDuration
    );

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (countryIds?.length) {
      whereClause.assignedTo = {
        countryId: { in: countryIds },
      };
    }

    if (sourceIds?.length) {
      whereClause.sourceId = { in: sourceIds };
    }

    if (assignedToIds?.length) {
      whereClause.assignedToId = { in: assignedToIds };
    }

    // Lead category filters
    switch (leadCategory) {
      case "withoutTasks":
        whereClause.tasks = { none: {} };
        break;
      case "unmanaged":
        whereClause.AND = [
          { quotations: { none: {} } },
          { reservations: { none: {} } },
          { sales: { none: {} } },
        ];
        break;
      case "closed":
        whereClause.isClosed = true;
        break;
      case "archived":
        whereClause.isArchived = true;
        break;
    }

    // Previous period where clause
    const previousWhereClause = {
      ...whereClause,
      createdAt: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
    };

    // Execute queries in parallel
    const [
      totalLeads,
      previousPeriodLeads,
      qualifiedLeads,
      conversionStats,
      topSource,
      leadsByQualification,
    ] = await Promise.all([
      // Total leads in current period
      prisma.lead.count({ where: whereClause }),

      // Total leads in previous period
      prisma.lead.count({ where: previousWhereClause }),

      // Qualified leads (GOOD_LEAD)
      prisma.lead.count({
        where: {
          ...whereClause,
          qualification: "GOOD_LEAD",
        },
      }),

      // Overall conversion stats
      prisma.lead.groupBy({
        by: ["qualification"],
        where: whereClause,
        _count: { qualification: true },
      }),

      // Top performing source
      prisma.lead.groupBy({
        by: ["sourceId"],
        where: whereClause,
        _count: { sourceId: true },
        orderBy: { _count: { sourceId: "desc" } },
        take: 1,
      }),

      // Leads by qualification for current period
      prisma.lead.groupBy({
        by: ["qualification"],
        where: whereClause,
        _count: { qualification: true },
      }),
    ]);

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";

    // Calculate percentage change
    const percentageChange =
      previousPeriodLeads > 0
        ? (
            ((totalLeads - previousPeriodLeads) / previousPeriodLeads) *
            100
          ).toFixed(1)
        : totalLeads > 0
          ? "100"
          : "0";

    // Get top source details
    let topSourceName = "Sin datos";
    if (topSource.length > 0) {
      const sourceDetail = await prisma.leadSource.findUnique({
        where: { id: topSource[0].sourceId },
        select: { name: true },
      });
      topSourceName = sourceDetail?.name || "Fuente desconocida";
    }

    const overview = {
      totalLeads,
      previousPeriodLeads,
      percentageChange: parseFloat(percentageChange),
      conversionRate: parseFloat(conversionRate),
      topSource: {
        name: topSourceName,
        count: topSource[0]?._count.sourceId || 0,
      },
      qualificationBreakdown: leadsByQualification.map((item) => ({
        qualification: item.qualification,
        count: item._count.qualification,
        percentage:
          totalLeads > 0
            ? ((item._count.qualification / totalLeads) * 100).toFixed(1)
            : "0",
      })),
    };

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error fetching leads analytics overview:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener métricas generales",
      },
      { status: 500 }
    );
  }
}
