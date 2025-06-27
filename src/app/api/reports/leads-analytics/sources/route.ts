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
    const sourceIds = searchParams.get("sourceIds")?.split(",").filter(Boolean);
    const assignedToId = searchParams.get("assignedToId");

    // Default to last 30 days if no dates provided
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(subDays(defaultEndDate, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (countryIds?.length) {
      whereClause.assignedTo = {
        countryId: { in: countryIds },
      };
    }

    if (sourceIds?.length) {
      whereClause.sourceId = { in: sourceIds };
    }

    if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    }

    // Get leads grouped by source
    const leadsGroupedBySource = await prisma.lead.groupBy({
      by: ["sourceId"],
      where: whereClause,
      _count: { sourceId: true },
      orderBy: { _count: { sourceId: "desc" } },
    });

    // Get source details with categories
    const sourceIds_fromData = leadsGroupedBySource.map(
      (item) => item.sourceId
    );
    const sourcesWithDetails = await prisma.leadSource.findMany({
      where: {
        id: { in: sourceIds_fromData },
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Calculate total leads for percentages
    const totalLeads = leadsGroupedBySource.reduce(
      (sum, item) => sum + item._count.sourceId,
      0
    );

    // Combine data with source details
    const sourcesData = leadsGroupedBySource.map((item, index) => {
      const sourceDetail = sourcesWithDetails.find(
        (source) => source.id === item.sourceId
      );
      const percentage =
        totalLeads > 0
          ? ((item._count.sourceId / totalLeads) * 100).toFixed(1)
          : "0";

      // Generate color based on category or use default colors
      const colors = [
        "#3b82f6",
        "#ef4444",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
        "#f97316",
        "#ec4899",
        "#6366f1",
      ];

      const color =
        sourceDetail?.category?.color || colors[index % colors.length];

      return {
        sourceId: item.sourceId,
        name: sourceDetail?.name || "Fuente desconocida",
        category: sourceDetail?.category?.name || "Sin categoría",
        count: item._count.sourceId,
        percentage: parseFloat(percentage),
        color,
        costPerSource: sourceDetail?.costPerSource || null,
      };
    });

    // Also get category-level aggregation
    const categoryAggregation = sourcesData.reduce(
      (acc, source) => {
        const categoryName = source.category;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            count: 0,
            sources: [],
          };
        }
        acc[categoryName].count += source.count;
        acc[categoryName].sources.push(source);
        return acc;
      },
      {} as Record<string, any>
    );

    const categoriesData = Object.values(categoryAggregation).map(
      (category: any) => ({
        ...category,
        percentage:
          totalLeads > 0
            ? ((category.count / totalLeads) * 100).toFixed(1)
            : "0",
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        sources: sourcesData,
        categories: categoriesData,
        totalLeads,
        period: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching leads sources distribution:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener distribución por fuente",
      },
      { status: 500 }
    );
  }
}
