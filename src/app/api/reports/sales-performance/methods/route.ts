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
        s.payment_method as paymentMethod,
        SUM(s.amount) AS revenue,
        COUNT(*) AS salesCount,
        ROUND((SUM(s.amount) * 100.0 / (
          SELECT SUM(amount) 
          FROM sales s2 
          JOIN leads l2 ON l2.id = s2.lead_id 
          JOIN users u2 ON u2.id = l2.assigned_to_id 
          WHERE ${whereConditions.join(" AND ").replace(/s\./g, "s2.").replace(/l\./g, "l2.").replace(/u\./g, "u2.")}
        ))::numeric, 1) AS percentage
      FROM sales s
      JOIN leads l ON l.id = s.lead_id
      JOIN users u ON u.id = l.assigned_to_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY s.payment_method
      ORDER BY revenue DESC
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params, ...params);

    // Payment method labels in Spanish
    const paymentMethodLabels: Record<string, string> = {
      CASH: "Efectivo",
      CARD: "Tarjeta",
      TRANSFER: "Transferencia",
      CHECK: "Cheque",
      FINANCING: "Financiamiento",
    };

    // Format the data for the frontend
    const methods = (result as any[]).map((row) => ({
      paymentMethod: row.paymentmethod,
      paymentMethodLabel:
        paymentMethodLabels[row.paymentmethod] || row.paymentmethod,
      revenue: Number(row.revenue) || 0,
      salesCount: Number(row.salescount) || 0,
      percentage: Number(row.percentage) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        methods,
      },
    });
  } catch (error) {
    console.error("Error in sales payment methods:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
