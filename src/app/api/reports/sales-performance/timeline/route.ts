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
    const groupBy = searchParams.get("groupBy") || "day";

    // Default last 30 days
    const defaultEnd = endOfDay(new Date());
    const defaultStart = startOfDay(subDays(defaultEnd, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStart;
    const periodEnd = endDate ? new Date(endDate) : defaultEnd;

    // Determine SQL date truncation
    const dateTrunc =
      groupBy === "week"
        ? "date_trunc('week', s.created_at)"
        : groupBy === "month"
          ? "date_trunc('month', s.created_at)"
          : "date_trunc('day', s.created_at)";

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
        ${dateTrunc} AS bucket,
        SUM(s.amount) AS revenue,
        COUNT(*) AS sales
      FROM sales s
      JOIN leads l ON l.id = s.lead_id
      JOIN users u ON u.id = l.assigned_to_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY bucket
      ORDER BY bucket
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params);

    // Format the data for the frontend
    const timeline = (result as any[]).map((row) => {
      const date = new Date(row.bucket);
      const dateValue = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Format display date based on groupBy
      let displayDate: string;
      if (groupBy === "month") {
        displayDate = date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
        });
      } else if (groupBy === "week") {
        displayDate = `Semana ${date.toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        })}`;
      } else {
        displayDate = date.toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        });
      }

      return {
        date: displayDate,
        dateValue,
        revenue: Number(row.revenue) || 0,
        sales: Number(row.sales) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        period: {
          startDate: periodStart.toISOString().split("T")[0],
          endDate: periodEnd.toISOString().split("T")[0],
          groupBy,
        },
      },
    });
  } catch (error) {
    console.error("Error in sales timeline:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
