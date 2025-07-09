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

    // Get products from quotations
    const quotationProducts = await prisma.$queryRaw`
      SELECT 
        COALESCE(p.name, 'Sin Producto') as product_name,
        p.currency,
        SUM(qp.price * qp.quantity) as total_revenue,
        COUNT(DISTINCT q.id) as quotation_count,
        SUM(qp.quantity) as total_quantity
      FROM quotations q
      LEFT JOIN quotation_products qp ON q.id = qp.quotation_id
      LEFT JOIN products p ON qp.product_id = p.id
      INNER JOIN leads l ON q.lead_id = l.id
      WHERE q.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND q.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      GROUP BY p.name, p.currency
      ORDER BY total_revenue DESC
      LIMIT 15
    `;

    // Get products from reservations (using lead's product)
    const reservationProducts = await prisma.$queryRaw`
      SELECT 
        COALESCE(p.name, 'Sin Producto') as product_name,
        r.currency,
        SUM(r.amount) as total_revenue,
        COUNT(DISTINCT r.id) as reservation_count
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      LEFT JOIN products p ON l.product_id = p.id
      WHERE r.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND r.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      GROUP BY p.name, r.currency
      ORDER BY total_revenue DESC
      LIMIT 15
    `;

    // Get products from sales (using lead's product)
    const salesProducts = await prisma.$queryRaw`
      SELECT 
        COALESCE(p.name, 'Sin Producto') as product_name,
        s.currency,
        SUM(s.amount) as total_revenue,
        COUNT(DISTINCT s.id) as sale_count
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      LEFT JOIN products p ON l.product_id = p.id
      WHERE s.created_at >= ${startDate ? new Date(startDate) : new Date("1900-01-01")}
        AND s.created_at <= ${endDate ? new Date(endDate) : new Date("2100-01-01")}
        ${userFilter ? prisma.$queryRaw`AND l.assigned_to_id = ANY(${userFilter})` : prisma.$queryRaw``}
        ${countryFilter ? prisma.$queryRaw`AND l.assigned_to_id IN (SELECT id FROM users WHERE country_id = ANY(${countryFilter}))` : prisma.$queryRaw``}
      GROUP BY p.name, s.currency
      ORDER BY total_revenue DESC
      LIMIT 15
    `;

    // Combine and aggregate products data
    const productMap = new Map<string, any>();

    // Helper function to process product data
    const processProductData = (data: any[], type: string) => {
      data.forEach((item: any) => {
        const productName = item.product_name;
        const currency = item.currency || "BOB";
        const key = `${productName}_${currency}`;

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
        const revenue = Number(item.total_revenue || 0);
        const count = Number(
          item.quotation_count || item.reservation_count || item.sale_count || 0
        );
        const quantity = Number(item.total_quantity || 0);

        if (type === "quotations") {
          entry.quotations = { count, revenue, quantity };
        } else if (type === "reservations") {
          entry.reservations = { count, revenue };
        } else if (type === "sales") {
          entry.sales = { count, revenue };
        }

        entry.totalRevenue += revenue;
        entry.totalCount += count;
      });
    };

    processProductData(quotationProducts as any[], "quotations");
    processProductData(reservationProducts as any[], "reservations");
    processProductData(salesProducts as any[], "sales");

    // Convert to array and sort by total revenue
    const products = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10); // Top 10 products

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
        products,
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
