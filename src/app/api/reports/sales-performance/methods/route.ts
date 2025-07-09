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

    // Get reservations with payment methods
    const reservations = await prisma.reservation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
      },
    });

    // Get sales with payment methods
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
      },
    });

    // Process and combine payment methods data
    const methodMap = new Map<string, any>();

    // Process reservations
    reservations.forEach((reservation) => {
      const method = reservation.paymentMethod;
      const currency = reservation.currency || "BOB";
      const key = `${method}_${currency}`;
      const revenue = Number(reservation.amount);

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
      entry.reservations.count += 1;
      entry.reservations.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Process sales
    sales.forEach((sale) => {
      const method = sale.paymentMethod;
      const currency = sale.currency || "BOB";
      const key = `${method}_${currency}`;
      const revenue = Number(sale.amount);

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
      entry.sales.count += 1;
      entry.sales.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

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
      method: method.method,
      label: paymentMethodTranslations[method.method] || method.method,
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
