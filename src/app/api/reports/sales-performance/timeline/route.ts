import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SUPPORTED_CURRENCIES } from "@/lib/reports/config";

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
    const period = searchParams.get("period") || "day"; // day, week, month

    // Build base date filter
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Build user filter
    const userFilter = assignedToIds?.length
      ? { in: assignedToIds }
      : undefined;

    // Build country filter
    const countryFilter = countryIds?.length ? { in: countryIds } : undefined;

    // Determine date_trunc format based on period
    const dateTruncFormat =
      period === "week" ? "week" : period === "month" ? "month" : "day";

    // Get quotations timeline
    const quotationsTimeline = await prisma.$queryRaw`
      SELECT 
        date_trunc(${dateTruncFormat}, q.created_at) as date,
        q.currency,
        COALESCE(SUM(q.total_amount), 0) as total_amount,
        COUNT(q.id) as count
      FROM quotations q
      INNER JOIN leads l ON q.lead_id = l.id
      ${userFilter ? prisma.$queryRaw`WHERE l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw`WHERE 1=1`}
      ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      ${startDate ? prisma.$queryRaw`AND q.created_at >= ${new Date(startDate)}` : prisma.$queryRaw``}
      ${endDate ? prisma.$queryRaw`AND q.created_at <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY date_trunc(${dateTruncFormat}, q.created_at), q.currency
      ORDER BY date_trunc(${dateTruncFormat}, q.created_at)
    `;

    // Get reservations timeline
    const reservationsTimeline = await prisma.$queryRaw`
      SELECT 
        date_trunc(${dateTruncFormat}, r.created_at) as date,
        r.currency,
        COALESCE(SUM(r.amount), 0) as amount,
        COUNT(r.id) as count
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      ${userFilter ? prisma.$queryRaw`WHERE l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw`WHERE 1=1`}
      ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      ${startDate ? prisma.$queryRaw`AND r.created_at >= ${new Date(startDate)}` : prisma.$queryRaw``}
      ${endDate ? prisma.$queryRaw`AND r.created_at <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY date_trunc(${dateTruncFormat}, r.created_at), r.currency
      ORDER BY date_trunc(${dateTruncFormat}, r.created_at)
    `;

    // Get sales timeline
    const salesTimeline = await prisma.$queryRaw`
      SELECT 
        date_trunc(${dateTruncFormat}, s.created_at) as date,
        s.currency,
        COALESCE(SUM(s.amount), 0) as amount,
        COUNT(s.id) as count
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      ${userFilter ? prisma.$queryRaw`WHERE l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw`WHERE 1=1`}
      ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      ${startDate ? prisma.$queryRaw`AND s.created_at >= ${new Date(startDate)}` : prisma.$queryRaw``}
      ${endDate ? prisma.$queryRaw`AND s.created_at <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY date_trunc(${dateTruncFormat}, s.created_at), s.currency
      ORDER BY date_trunc(${dateTruncFormat}, s.created_at)
    `;

    // Process and combine timeline data
    const combinedTimeline = new Map<string, any>();

    // Helper function to process timeline data
    const processTimelineData = (data: any[], type: string) => {
      data.forEach((item: any) => {
        const dateKey = item.date.toISOString().split("T")[0];
        const currency = item.currency;
        const compositeKey = `${dateKey}_${currency}`;

        if (!combinedTimeline.has(compositeKey)) {
          combinedTimeline.set(compositeKey, {
            date: dateKey,
            currency,
            quotations: { count: 0, amount: 0 },
            reservations: { count: 0, amount: 0 },
            sales: { count: 0, amount: 0 },
            totalAmount: 0,
            totalCount: 0,
          });
        }

        const entry = combinedTimeline.get(compositeKey);
        const amount = Number(item.total_amount || item.amount || 0);
        const count = Number(item.count || 0);

        entry[type] = { count, amount };
        entry.totalAmount += amount;
        entry.totalCount += count;
      });
    };

    processTimelineData(quotationsTimeline as any[], "quotations");
    processTimelineData(reservationsTimeline as any[], "reservations");
    processTimelineData(salesTimeline as any[], "sales");

    // Convert to array and sort by date
    const timeline = Array.from(combinedTimeline.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by currency for better visualization
    const timelineByCurrency = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        acc[currency] = timeline
          .filter((item) => item.currency === currency)
          .map((item) => ({
            date: item.date,
            quotations: item.quotations,
            reservations: item.reservations,
            sales: item.sales,
            totalAmount: item.totalAmount,
            totalCount: item.totalCount,
          }));
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate totals by currency
    const currencyTotals = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const currencyData = timelineByCurrency[currency];
        acc[currency] = {
          currency,
          quotations: currencyData.reduce(
            (sum, item) => ({
              count: sum.count + item.quotations.count,
              amount: sum.amount + item.quotations.amount,
            }),
            { count: 0, amount: 0 }
          ),
          reservations: currencyData.reduce(
            (sum, item) => ({
              count: sum.count + item.reservations.count,
              amount: sum.amount + item.reservations.amount,
            }),
            { count: 0, amount: 0 }
          ),
          sales: currencyData.reduce(
            (sum, item) => ({
              count: sum.count + item.sales.count,
              amount: sum.amount + item.sales.amount,
            }),
            { count: 0, amount: 0 }
          ),
        };
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        timelineByCurrency,
        currencyTotals,
        period: {
          type: period,
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales timeline:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching sales timeline" },
      { status: 500 }
    );
  }
}
