import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  subDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

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
    const assignedToId = searchParams.get("assignedToId");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    // Default to last 30 days if no dates provided
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(subDays(defaultEndDate, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

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

    if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    }

    // Get all leads in the period with qualification
    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        qualification: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Generate date intervals based on groupBy
    let dateIntervals: Date[] = [];
    let formatString = "";

    switch (groupBy) {
      case "day":
        dateIntervals = eachDayOfInterval({
          start: periodStart,
          end: periodEnd,
        });
        formatString = "dd/MM";
        break;
      case "week":
        // Generate weekly intervals
        let current = startOfDay(periodStart);
        while (current <= periodEnd) {
          dateIntervals.push(current);
          current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        formatString = "'Sem' w";
        break;
      case "month":
        // Generate monthly intervals
        let monthCurrent = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          1
        );
        while (monthCurrent <= periodEnd) {
          dateIntervals.push(monthCurrent);
          monthCurrent = new Date(
            monthCurrent.getFullYear(),
            monthCurrent.getMonth() + 1,
            1
          );
        }
        formatString = "MMM yyyy";
        break;
    }

    // Group leads by date and qualification
    const timelineData = dateIntervals.map((interval) => {
      const nextInterval =
        groupBy === "day"
          ? endOfDay(interval)
          : groupBy === "week"
            ? new Date(interval.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
            : new Date(
                interval.getFullYear(),
                interval.getMonth() + 1,
                0,
                23,
                59,
                59
              );

      const periodLeads = leads.filter(
        (lead) => lead.createdAt >= interval && lead.createdAt <= nextInterval
      );

      const goodLeads = periodLeads.filter(
        (lead) => lead.qualification === "GOOD_LEAD"
      ).length;
      const badLeads = periodLeads.filter(
        (lead) => lead.qualification === "BAD_LEAD"
      ).length;
      const notQualified = periodLeads.filter(
        (lead) => lead.qualification === "NOT_QUALIFIED"
      ).length;

      return {
        date: format(interval, formatString, { locale: es }),
        dateValue: interval.toISOString(),
        goodLeads,
        badLeads,
        notQualified,
        total: periodLeads.length,
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
    console.error("Error fetching leads timeline:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener datos de evolución temporal",
      },
      { status: 500 }
    );
  }
}
