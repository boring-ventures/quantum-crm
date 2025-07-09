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
    const period =
      searchParams.get("groupBy") || searchParams.get("period") || "day"; // day, week, month

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Build lead filter
    const leadFilter: any = {};
    if (assignedToIds?.length) {
      leadFilter.assignedToId = { in: assignedToIds };
    }
    if (countryIds?.length) {
      leadFilter.assignedTo = {
        countryId: { in: countryIds },
      };
    }

    // Get quotations with lead data
    const quotations = await prisma.quotation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        currency: true,
      },
    });

    // Get reservations with lead data
    const reservations = await prisma.reservation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        currency: true,
      },
    });

    // Get sales with lead data
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        currency: true,
      },
    });

    // Process and combine timeline data
    const combinedTimeline = new Map<string, any>();

    // Helper function to get date key based on period
    const getDateKey = (date: Date) => {
      if (period === "week") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split("T")[0];
      } else if (period === "month") {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-01`;
      } else {
        return date.toISOString().split("T")[0];
      }
    };

    // Helper function to process timeline data
    const processTimelineData = (
      data: any[],
      type: string,
      amountField: string
    ) => {
      data.forEach((item: any) => {
        const dateKey = getDateKey(new Date(item.createdAt));
        const currency = item.currency || "BOB";
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
        const amount = Number(item[amountField] || 0);

        entry[type].count += 1;
        entry[type].amount += amount;
        entry.totalAmount += amount;
        entry.totalCount += 1;
      });
    };

    processTimelineData(quotations, "quotations", "totalAmount");
    processTimelineData(reservations, "reservations", "amount");
    processTimelineData(sales, "sales", "amount");

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

    // Prepare simplified timeline for the chart component (date, revenue, sales)
    const simpleTimeline = timeline.map((item) => ({
      date: item.date,
      revenue: item.totalAmount,
      sales: item.totalCount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        timeline: simpleTimeline,
        period: {
          startDate,
          endDate,
          groupBy: period,
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
