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

    // Get quotations with country data
    const quotations = await prisma.quotation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        totalAmount: true,
        currency: true,
        lead: {
          select: {
            assignedTo: {
              select: {
                country: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get reservations with country data
    const reservations = await prisma.reservation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        lead: {
          select: {
            assignedTo: {
              select: {
                country: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get sales with country data
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        lead: {
          select: {
            assignedTo: {
              select: {
                country: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Process and combine countries data
    const countryMap = new Map<string, any>();

    // Process quotations
    quotations.forEach((quotation) => {
      const countryName = quotation.lead.assignedTo.country?.name || "Sin País";
      const countryCode = quotation.lead.assignedTo.country?.code || "XX";
      const currency = quotation.currency || "BOB";
      const key = `${countryName}_${currency}`;
      const revenue = Number(quotation.totalAmount);

      if (!countryMap.has(key)) {
        countryMap.set(key, {
          name: countryName,
          code: countryCode,
          currency,
          quotations: { count: 0, revenue: 0 },
          reservations: { count: 0, revenue: 0 },
          sales: { count: 0, revenue: 0 },
          totalRevenue: 0,
          totalCount: 0,
        });
      }

      const entry = countryMap.get(key);
      entry.quotations.count += 1;
      entry.quotations.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Process reservations
    reservations.forEach((reservation) => {
      const countryName =
        reservation.lead.assignedTo.country?.name || "Sin País";
      const countryCode = reservation.lead.assignedTo.country?.code || "XX";
      const currency = reservation.currency || "BOB";
      const key = `${countryName}_${currency}`;
      const revenue = Number(reservation.amount);

      if (!countryMap.has(key)) {
        countryMap.set(key, {
          name: countryName,
          code: countryCode,
          currency,
          quotations: { count: 0, revenue: 0 },
          reservations: { count: 0, revenue: 0 },
          sales: { count: 0, revenue: 0 },
          totalRevenue: 0,
          totalCount: 0,
        });
      }

      const entry = countryMap.get(key);
      entry.reservations.count += 1;
      entry.reservations.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Process sales
    sales.forEach((sale) => {
      const countryName = sale.lead.assignedTo.country?.name || "Sin País";
      const countryCode = sale.lead.assignedTo.country?.code || "XX";
      const currency = sale.currency || "BOB";
      const key = `${countryName}_${currency}`;
      const revenue = Number(sale.amount);

      if (!countryMap.has(key)) {
        countryMap.set(key, {
          name: countryName,
          code: countryCode,
          currency,
          quotations: { count: 0, revenue: 0 },
          reservations: { count: 0, revenue: 0 },
          sales: { count: 0, revenue: 0 },
          totalRevenue: 0,
          totalCount: 0,
        });
      }

      const entry = countryMap.get(key);
      entry.sales.count += 1;
      entry.sales.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Convert to array and sort by total revenue
    const countries = Array.from(countryMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // Group by currency for better visualization
    const countriesByCurrency = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        acc[currency] = countries
          .filter((country) => country.currency === currency)
          .map((country) => ({
            name: country.name,
            code: country.code,
            quotations: country.quotations,
            reservations: country.reservations,
            sales: country.sales,
            totalRevenue: country.totalRevenue,
            totalCount: country.totalCount,
          }));
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate totals by currency
    const currencyTotals = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const currencyCountries = countriesByCurrency[currency];
        acc[currency] = {
          currency,
          totalCountries: currencyCountries.length,
          totalRevenue: currencyCountries.reduce(
            (sum, country) => sum + country.totalRevenue,
            0
          ),
          quotations: currencyCountries.reduce(
            (sum, country) => ({
              count: sum.count + country.quotations.count,
              revenue: sum.revenue + country.quotations.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
          reservations: currencyCountries.reduce(
            (sum, country) => ({
              count: sum.count + country.reservations.count,
              revenue: sum.revenue + country.reservations.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
          sales: currencyCountries.reduce(
            (sum, country) => ({
              count: sum.count + country.sales.count,
              revenue: sum.revenue + country.sales.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
        };
        return acc;
      },
      {} as Record<string, any>
    );

    // Prepare data for frontend
    const countriesForChart = countries.map((c) => ({
      countryName: c.name,
      countryCode: c.code,
      revenue: c.totalRevenue,
      salesCount: c.totalCount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        countries: countriesForChart,
        countriesByCurrency,
        currencyTotals,
      },
    });
  } catch (error) {
    console.error("Error fetching countries performance:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching countries performance" },
      { status: 500 }
    );
  }
}
