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

    // Build user filter
    const userFilter = assignedToIds?.length
      ? { in: assignedToIds }
      : undefined;

    // Build country filter
    const countryFilter = countryIds?.length ? { in: countryIds } : undefined;

    // Get quotations by country
    const quotationsByCountry = await prisma.$queryRaw`
      SELECT 
        c.name as country_name,
        c.code as country_code,
        q.currency,
        COALESCE(SUM(q.total_amount), 0) as total_revenue,
        COUNT(q.id) as count
      FROM quotations q
      INNER JOIN leads l ON q.lead_id = l.id
      INNER JOIN users u ON l.assigned_to_id = u.id
      INNER JOIN countries c ON u.country_id = c.id
      WHERE q.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND q.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND c.id = ANY(${countryFilter})` : prisma.$queryRaw``}
      GROUP BY c.name, c.code, q.currency
      ORDER BY total_revenue DESC
    `;

    // Get reservations by country
    const reservationsByCountry = await prisma.$queryRaw`
      SELECT 
        c.name as country_name,
        c.code as country_code,
        r.currency,
        COALESCE(SUM(r.amount), 0) as total_revenue,
        COUNT(r.id) as count
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      INNER JOIN users u ON l.assigned_to_id = u.id
      INNER JOIN countries c ON u.country_id = c.id
      WHERE r.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND r.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND c.id = ANY(${countryFilter})` : prisma.$queryRaw``}
      GROUP BY c.name, c.code, r.currency
      ORDER BY total_revenue DESC
    `;

    // Get sales by country
    const salesByCountry = await prisma.$queryRaw`
      SELECT 
        c.name as country_name,
        c.code as country_code,
        s.currency,
        COALESCE(SUM(s.amount), 0) as total_revenue,
        COUNT(s.id) as count
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      INNER JOIN users u ON l.assigned_to_id = u.id
      INNER JOIN countries c ON u.country_id = c.id
      WHERE s.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND s.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND c.id = ANY(${countryFilter})` : prisma.$queryRaw``}
      GROUP BY c.name, c.code, s.currency
      ORDER BY total_revenue DESC
    `;

    // Combine and aggregate countries data
    const countryMap = new Map<string, any>();

    // Helper function to process country data
    const processCountryData = (data: any[], type: string) => {
      data.forEach((item: any) => {
        const countryName = item.country_name;
        const countryCode = item.country_code;
        const currency = item.currency || "BOB";
        const key = `${countryName}_${currency}`;

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
        const revenue = Number(item.total_revenue || 0);
        const count = Number(item.count || 0);

        if (type === "quotations") {
          entry.quotations = { count, revenue };
        } else if (type === "reservations") {
          entry.reservations = { count, revenue };
        } else if (type === "sales") {
          entry.sales = { count, revenue };
        }

        entry.totalRevenue += revenue;
        entry.totalCount += count;
      });
    };

    processCountryData(quotationsByCountry as any[], "quotations");
    processCountryData(reservationsByCountry as any[], "reservations");
    processCountryData(salesByCountry as any[], "sales");

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

    return NextResponse.json({
      success: true,
      data: {
        countries,
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
