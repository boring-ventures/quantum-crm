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
    const currencyParam = searchParams.get("currency");

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

    // Get quotations with products
    const quotations = await prisma.quotation.findMany({
      where: {
        createdAt: dateFilter,
        lead: leadFilter,
      },
      select: {
        id: true,
        totalAmount: true,
        currency: true,
        quotationProducts: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    // Get reservations with products from lead
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
            product: {
              select: {
                name: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    // Get sales with products from lead
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
            product: {
              select: {
                name: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    // Process and combine products data
    const productMap = new Map<string, any>();

    // Process quotations products
    quotations.forEach((quotation) => {
      if (quotation.quotationProducts.length > 0) {
        quotation.quotationProducts.forEach((qp) => {
          const productName = qp.product?.name || "Sin Producto";
          const currency = qp.product?.currency || quotation.currency || "BOB";
          const key = `${productName}_${currency}`;
          const revenue = Number(qp.price) * Number(qp.quantity);

          if (!productMap.has(key)) {
            productMap.set(key, {
              name: productName,
              currency,
              quotations: { count: 0, revenue: 0, quantity: 0 },
              reservations: { count: 0, revenue: 0 },
              sales: { count: 0, revenue: 0 },
              totalRevenue: 0,
              totalCount: 0,
            });
          }

          const entry = productMap.get(key);
          entry.quotations.count += 1;
          entry.quotations.revenue += revenue;
          entry.quotations.quantity += Number(qp.quantity);
          entry.totalRevenue += revenue;
          entry.totalCount += 1;
        });
      } else {
        // Handle quotations without products
        const productName = "Sin Producto";
        const currency = quotation.currency || "BOB";
        const key = `${productName}_${currency}`;
        const revenue = Number(quotation.totalAmount);

        if (!productMap.has(key)) {
          productMap.set(key, {
            name: productName,
            currency,
            quotations: { count: 0, revenue: 0, quantity: 0 },
            reservations: { count: 0, revenue: 0 },
            sales: { count: 0, revenue: 0 },
            totalRevenue: 0,
            totalCount: 0,
          });
        }

        const entry = productMap.get(key);
        entry.quotations.count += 1;
        entry.quotations.revenue += revenue;
        entry.totalRevenue += revenue;
        entry.totalCount += 1;
      }
    });

    // Process reservations products
    reservations.forEach((reservation) => {
      const productName = reservation.lead.product?.name || "Sin Producto";
      const currency =
        reservation.lead.product?.currency || reservation.currency || "BOB";
      const key = `${productName}_${currency}`;
      const revenue = Number(reservation.amount);

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: productName,
          currency,
          quotations: { count: 0, revenue: 0, quantity: 0 },
          reservations: { count: 0, revenue: 0 },
          sales: { count: 0, revenue: 0 },
          totalRevenue: 0,
          totalCount: 0,
        });
      }

      const entry = productMap.get(key);
      entry.reservations.count += 1;
      entry.reservations.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Process sales products
    sales.forEach((sale) => {
      const productName = sale.lead.product?.name || "Sin Producto";
      const currency = sale.lead.product?.currency || sale.currency || "BOB";
      const key = `${productName}_${currency}`;
      const revenue = Number(sale.amount);

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: productName,
          currency,
          quotations: { count: 0, revenue: 0, quantity: 0 },
          reservations: { count: 0, revenue: 0 },
          sales: { count: 0, revenue: 0 },
          totalRevenue: 0,
          totalCount: 0,
        });
      }

      const entry = productMap.get(key);
      entry.sales.count += 1;
      entry.sales.revenue += revenue;
      entry.totalRevenue += revenue;
      entry.totalCount += 1;
    });

    // Convert to array and sort by total revenue
    const products = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10); // Top 10 products

    // Reformat products for frontend (revenue, salesCount, avgPrice)
    const productsForChart = products.map((p) => ({
      name: p.name,
      revenue: p.totalRevenue,
      salesCount: p.totalCount,
      avgPrice: p.totalCount > 0 ? p.totalRevenue / p.totalCount : 0,
    }));

    // Group by currency for better visualization
    const productsByCurrency = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        acc[currency] = products
          .filter((product) => product.currency === currency)
          .map((product) => ({
            name: product.name,
            quotations: product.quotations,
            reservations: product.reservations,
            sales: product.sales,
            totalRevenue: product.totalRevenue,
            totalCount: product.totalCount,
          }));
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate totals by currency
    const currencyTotals = Object.keys(SUPPORTED_CURRENCIES).reduce(
      (acc, currency) => {
        const currencyProducts = productsByCurrency[currency];
        acc[currency] = {
          currency,
          totalProducts: currencyProducts.length,
          totalRevenue: currencyProducts.reduce(
            (sum, product) => sum + product.totalRevenue,
            0
          ),
          quotations: currencyProducts.reduce(
            (sum, product) => ({
              count: sum.count + product.quotations.count,
              revenue: sum.revenue + product.quotations.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
          reservations: currencyProducts.reduce(
            (sum, product) => ({
              count: sum.count + product.reservations.count,
              revenue: sum.revenue + product.reservations.revenue,
            }),
            { count: 0, revenue: 0 }
          ),
          sales: currencyProducts.reduce(
            (sum, product) => ({
              count: sum.count + product.sales.count,
              revenue: sum.revenue + product.sales.revenue,
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
        products: productsForChart,
        productsByCurrency,
        currencyTotals,
      },
    });
  } catch (error) {
    console.error("Error fetching products performance:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching products performance" },
      { status: 500 }
    );
  }
}
