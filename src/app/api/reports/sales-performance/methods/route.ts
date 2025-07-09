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

    // Get payment methods from reservations
    const reservationMethods = await prisma.$queryRaw`
      SELECT 
        r.payment_method,
        r.currency,
        SUM(r.amount) as total_revenue,
        COUNT(r.id) as count
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      WHERE r.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND r.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      GROUP BY r.payment_method, r.currency
      ORDER BY total_revenue DESC
    `;

    // Get payment methods from sales
    const salesMethods = await prisma.$queryRaw`
      SELECT 
        s.payment_method,
        s.currency,
        SUM(s.amount) as total_revenue,
        COUNT(s.id) as count
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      WHERE s.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND s.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      GROUP BY s.payment_method, s.currency
      ORDER BY total_revenue DESC
    `;

    // Combine and aggregate payment methods data
    const methodMap = new Map<string, any>();

    // Helper function to process payment method data
    const processMethodData = (data: any[], type: string) => {
      data.forEach((item: any) => {
        const method = item.payment_method;
        const currency = item.currency || "BOB";
        const key = `${method}_${currency}`;

        if (!methodMap.has(key)) {
          methodMap.set(key, {
            method,
            currency,
            reservations: { count: 0, revenue: 0 },
            sales: { count: 0, revenue: 0 },
            totalRevenue: 0,
            totalCount: 0,
          });
        }

        const entry = methodMap.get(key);
        const revenue = Number(item.total_revenue || 0);
        const count = Number(item.count || 0);

        if (type === "reservations") {
          entry.reservations = { count, revenue };
        } else if (type === "sales") {
          entry.sales = { count, revenue };
        }

        entry.totalRevenue += revenue;
        entry.totalCount += count;
      });
    };

    processMethodData(reservationMethods as any[], "reservations");
    processMethodData(salesMethods as any[], "sales");

    // Convert to array and sort by total count
    const methods = Array.from(methodMap.values()).sort(
      (a, b) => b.totalCount - a.totalCount
    );

    // Calculate total for percentage calculation
    const totalCount = methods.reduce(
      (sum, method) => sum + method.totalCount,
      0
    );
    const totalRevenue = methods.reduce(
      (sum, method) => sum + method.totalRevenue,
      0
    );

    // Add percentage to each method
    const methodsWithPercentage = methods.map((method) => ({
      ...method,
      percentage: totalCount > 0 ? (method.totalCount / totalCount) * 100 : 0,
      revenuePercentage:
        totalRevenue > 0 ? (method.totalRevenue / totalRevenue) * 100 : 0,
    }));

    // Group by currency for better visualization
    const methodsByCurrency = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const currencyMethods = methodsWithPercentage.filter(
          (method) => method.currency === currency
        );
        const currencyTotal = currencyMethods.reduce(
          (sum, method) => sum + method.totalCount,
          0
        );

        acc[currency] = currencyMethods.map((method) => ({
          method: method.method,
          reservations: method.reservations,
          sales: method.sales,
          totalRevenue: method.totalRevenue,
          totalCount: method.totalCount,
          percentage:
            currencyTotal > 0 ? (method.totalCount / currencyTotal) * 100 : 0,
          revenuePercentage: method.revenuePercentage,
        }));
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate totals by currency
    const currencyTotals = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const currencyMethods = methodsByCurrency[currency];
        acc[currency] = {
          currency,
          totalMethods: currencyMethods.length,
          totalRevenue: currencyMethods.reduce(
            (sum, method) => sum + method.totalRevenue,
            0
          ),
          totalCount: currencyMethods.reduce(
            (sum, method) => sum + method.totalCount,
            0
          ),
          reservations: currencyMethods.reduce(
            (sum, method) => ({
              count: sum.count + method.reservations.count,
              revenue: sum.revenue + method.reservations.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
          sales: currencyMethods.reduce(
            (sum, method) => ({
              count: sum.count + method.sales.count,
              revenue: sum.revenue + method.sales.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
        };
        return acc;
      },
      {} as Record<string, any>
    );

    // Payment method translations
    const paymentMethodTranslations: Record<string, string> = {
      CASH: "Efectivo",
      CARD: "Tarjeta",
      TRANSFER: "Transferencia",
      CHECK: "Cheque",
      FINANCING: "Financiamiento",
    };

    // Transform for frontend consumption
    const paymentMethods = methodsWithPercentage.map((method) => ({
      method: paymentMethodTranslations[method.method] || method.method,
      currency: method.currency,
      count: method.totalCount,
      revenue: method.totalRevenue,
      percentage: method.percentage,
      revenuePercentage: method.revenuePercentage,
      reservations: method.reservations,
      sales: method.sales,
    }));

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods,
        methodsByCurrency,
        currencyTotals,
        summary: {
          totalCount,
          totalRevenue,
          totalMethods: methods.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment methods performance:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching payment methods performance" },
      { status: 500 }
    );
  }
}
