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

    // Build base date filter
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Build user filter for assigned leads
    const userFilter = assignedToIds?.length
      ? { in: assignedToIds }
      : undefined;

    // Build country filter
    const countryFilter = countryIds?.length ? { in: countryIds } : undefined;

    // Get total leads for conversion rate calculation
    const totalLeads = await prisma.lead.count({
      where: {
        createdAt: dateFilter,
        ...(userFilter && { assignedToId: userFilter }),
        ...(countryFilter && {
          assignedTo: {
            countryId: countryFilter,
          },
        }),
      },
    });

    // Get quotations data grouped by currency
    const quotations = await prisma.quotation.groupBy({
      by: ["currency"],
      where: {
        createdAt: dateFilter,
        lead: {
          ...(userFilter && { assignedToId: userFilter }),
          ...(countryFilter && {
            assignedTo: {
              countryId: countryFilter,
            },
          }),
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get reservations data grouped by currency
    const reservations = await prisma.reservation.groupBy({
      by: ["currency"],
      where: {
        createdAt: dateFilter,
        lead: {
          ...(userFilter && { assignedToId: userFilter }),
          ...(countryFilter && {
            assignedTo: {
              countryId: countryFilter,
            },
          }),
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get sales data grouped by currency
    const sales = await prisma.sale.groupBy({
      by: ["currency"],
      where: {
        createdAt: dateFilter,
        lead: {
          ...(userFilter && { assignedToId: userFilter }),
          ...(countryFilter && {
            assignedTo: {
              countryId: countryFilter,
            },
          }),
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get unique leads that have quotations, reservations, or sales
    const uniqueLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { quotations: { some: { createdAt: dateFilter } } },
          { reservations: { some: { createdAt: dateFilter } } },
          { sales: { some: { createdAt: dateFilter } } },
        ],
        ...(userFilter && { assignedToId: userFilter }),
        ...(countryFilter && {
          assignedTo: {
            countryId: countryFilter,
          },
        }),
      },
      select: { id: true },
      distinct: ["id"],
    });

    // Calculate totals by currency
    const currencyTotals = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const quotationData = quotations.find((q) => q.currency === currency);
        const reservationData = reservations.find(
          (r) => r.currency === currency
        );
        const salesData = sales.find((s) => s.currency === currency);

        acc[currency] = {
          currency,
          quotations: {
            count: quotationData?._count.id || 0,
            amount: Number(quotationData?._sum.totalAmount || 0),
          },
          reservations: {
            count: reservationData?._count.id || 0,
            amount: Number(reservationData?._sum.amount || 0),
          },
          sales: {
            count: salesData?._count.id || 0,
            amount: Number(salesData?._sum.amount || 0),
          },
        };

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate overall totals
    const totalQuotations = quotations.reduce(
      (sum, q) => sum + (q._count.id || 0),
      0
    );
    const totalReservations = reservations.reduce(
      (sum, r) => sum + (r._count.id || 0),
      0
    );
    const totalSales = sales.reduce((sum, s) => sum + (s._count.id || 0), 0);

    const totalRevenue = [
      ...quotations.map((q) => Number(q._sum.totalAmount || 0)),
      ...reservations.map((r) => Number(r._sum.amount || 0)),
      ...sales.map((s) => Number(s._sum.amount || 0)),
    ].reduce((sum, amount) => sum + amount, 0);

    const totalProcesses = totalQuotations + totalReservations + totalSales;
    const avgTicket = totalProcesses > 0 ? totalRevenue / totalProcesses : 0;
    const conversionRate =
      totalLeads > 0 ? (uniqueLeads.length / totalLeads) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalQuotations,
          totalReservations,
          totalSales,
          totalProcesses,
          avgTicket,
          conversionRate,
          convertedLeads: uniqueLeads.length,
        },
        byCurrency: currencyTotals,
      },
    });
  } catch (error) {
    console.error("Error fetching sales performance overview:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching sales performance overview" },
      { status: 500 }
    );
  }
}
