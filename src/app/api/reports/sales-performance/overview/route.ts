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
    const assignedToIds = searchParams
      .get("assignedToIds")
      ?.split(",")
      .filter(Boolean);

    // default last 30 days
    const defaultEnd = endOfDay(new Date());
    const defaultStart = startOfDay(subDays(defaultEnd, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStart;
    const periodEnd = endDate ? new Date(endDate) : defaultEnd;

    // build where for sales
    const saleWhere: any = {
      createdAt: { gte: periodStart, lte: periodEnd },
      lead: {
        isArchived: false,
        isClosed: false,
      },
    };

    if (countryIds?.length) {
      saleWhere.lead.assignedTo = { countryId: { in: countryIds } };
    }
    if (assignedToIds?.length) {
      saleWhere.lead.assignedToId = { in: assignedToIds };
    }

    const [salesAgg, totalLeads] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: saleWhere,
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
          isArchived: false,
          isClosed: false,
          ...(countryIds?.length
            ? { assignedTo: { countryId: { in: countryIds } } }
            : {}),
          ...(assignedToIds?.length
            ? { assignedToId: { in: assignedToIds } }
            : {}),
        },
      }),
    ]);

    const revenue = salesAgg._sum.amount ?? 0;
    const salesCount = salesAgg._count.id;
    const avgTicket = salesCount > 0 ? Number(revenue) / salesCount : 0;
    const conversionRate = totalLeads > 0 ? (salesCount / totalLeads) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        revenue,
        salesCount,
        avgTicket,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("Error sales performance overview", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
