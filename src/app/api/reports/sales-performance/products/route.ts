import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

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
    const leadCategory = searchParams.get("leadCategory");

    // Default last 30 days
    const defaultEnd = endOfDay(new Date());
    const defaultStart = startOfDay(subDays(defaultEnd, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStart;
    const periodEnd = endDate ? new Date(endDate) : defaultEnd;

    // Build where conditions
    let whereConditions = [
      "s.created_at >= $1",
      "s.created_at <= $2",
      "l.is_archived = false",
      "l.is_closed = false",
    ];

    let paramIndex = 3;
    const params: any[] = [periodStart, periodEnd];

    if (countryIds?.length) {
      whereConditions.push(`u.country_id = ANY($${paramIndex})`);
      params.push(countryIds);
      paramIndex++;
    }

    if (assignedToIds?.length) {
      whereConditions.push(`l.assigned_to_id = ANY($${paramIndex})`);
      params.push(assignedToIds);
      paramIndex++;
    }

    // Handle leadCategory filter logic
    if (leadCategory && leadCategory !== "all") {
      switch (leadCategory) {
        case "withoutTasks":
          whereConditions.push(`NOT EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.lead_id = l.id 
            AND t.status IN ('PENDING', 'IN_PROGRESS')
          )`);
          break;
        case "unmanaged":
          whereConditions.push(`l.last_contacted_at IS NULL`);
          break;
        case "closed":
          whereConditions.push(`l.is_closed = true`);
          break;
        case "archived":
          whereConditions.push(`l.is_archived = true`);
          break;
      }
    }

    const query = `
      SELECT 
        COALESCE(p.name, 'Sin Producto') AS name,
        SUM(s.amount) AS revenue,
        COUNT(*) AS salesCount,
        AVG(p.price) AS avgPrice
      FROM sales s
      JOIN leads l ON l.id = s.lead_id
      JOIN users u ON u.id = l.assigned_to_id
      LEFT JOIN products p ON p.id = l.product_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY p.id, p.name, p.price
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params);

    // Format the data for the frontend
    const products = (result as any[]).map((row) => ({
      name: row.name,
      revenue: Number(row.revenue) || 0,
      salesCount: Number(row.salescount) || 0,
      avgPrice: Number(row.avgprice) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error("Error in sales products:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
