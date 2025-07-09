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

    const totalQuotationsAmount = quotations.reduce(
      (sum, q) => sum + Number(q._sum.totalAmount || 0),
      0
    );
    const totalReservationsAmount = reservations.reduce(
      (sum, r) => sum + Number(r._sum.amount || 0),
      0
    );
    const totalSalesAmount = sales.reduce(
      (sum, s) => sum + Number(s._sum.amount || 0),
      0
    );
    const totalRevenue =
      totalQuotationsAmount + totalReservationsAmount + totalSalesAmount;

    // Calculate totals by currency
    const byCurrency: Record<string, any> = {};
    for (const currency of Object.keys(SUPPORTED_CURRENCIES)) {
      const currencyQuotations = quotations.filter(
        (q) => q.currency === currency
      );
      const currencyReservations = reservations.filter(
        (r) => r.currency === currency
      );
      const currencySales = sales.filter((s) => s.currency === currency);

      byCurrency[currency] = {
        quotations: {
          count: currencyQuotations.reduce((sum, q) => sum + q._count.id, 0),
          amount: currencyQuotations.reduce(
            (sum, q) => sum + Number(q._sum.totalAmount || 0),
            0
          ),
        },
        reservations: {
          count: currencyReservations.reduce((sum, r) => sum + r._count.id, 0),
          amount: currencyReservations.reduce(
            (sum, r) => sum + Number(r._sum.amount || 0),
            0
          ),
        },
        sales: {
          count: currencySales.reduce((sum, s) => sum + s._count.id, 0),
          amount: currencySales.reduce(
            (sum, s) => sum + Number(s._sum.amount || 0),
            0
          ),
        },
      };
    }

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
        byCurrency: byCurrency,
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
