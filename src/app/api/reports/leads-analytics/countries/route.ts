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

    // Build base where clause for filtering
    const baseWhereClause: any = {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (sourceIds?.length) {
      baseWhereClause.sourceId = { in: sourceIds };
    }

    if (assignedToId) {
      baseWhereClause.assignedToId = assignedToId;
    }

    // Get leads grouped by country (through assignedTo user)
    const leadsGroupedByCountry = await prisma.lead.groupBy({
      by: ["assignedToId"],
      where: {
        ...baseWhereClause,
        ...(countryIds?.length
          ? {
              assignedTo: {
                countryId: { in: countryIds },
              },
            }
          : {}),
      },
      _count: { assignedToId: true },
    });

    // Get user details with countries
    const userIds = leadsGroupedByCountry.map((item) => item.assignedToId);
    const usersWithCountries = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Aggregate by country
    const countryAggregation = leadsGroupedByCountry.reduce(
      (acc, item) => {
        const user = usersWithCountries.find((u) => u.id === item.assignedToId);
        const country = user?.country;

        if (!country) return acc;

        const countryKey = country.id;
        if (!acc[countryKey]) {
          acc[countryKey] = {
            countryId: country.id,
            name: country.name,
            code: country.code,
            totalLeads: 0,
            users: [],
            qualifiedLeads: 0,
          };
        }

        acc[countryKey].totalLeads += item._count.assignedToId;
        acc[countryKey].users.push({
          userId: user.id,
          name: user.name,
          leads: item._count.assignedToId,
        });

        return acc;
      },
      {} as Record<string, any>
    );

    // Get qualified leads count by country
    for (const countryData of Object.values(countryAggregation) as any[]) {
      const userIds = countryData.users.map((u: any) => u.userId);

      const qualifiedCount = await prisma.lead.count({
        where: {
          ...baseWhereClause,
          assignedToId: { in: userIds },
          qualification: "GOOD_LEAD",
        },
      });

      countryData.qualifiedLeads = qualifiedCount;
      countryData.conversionRate =
        countryData.totalLeads > 0
          ? ((qualifiedCount / countryData.totalLeads) * 100).toFixed(1)
          : "0";
    }

    // Sort by total leads and take top 10
    const countriesData = Object.values(countryAggregation)
      .sort((a: any, b: any) => b.totalLeads - a.totalLeads)
      .slice(0, 10)
      .map((country: any) => ({
        countryId: country.countryId,
        name: country.name,
        code: country.code,
        totalLeads: country.totalLeads,
        qualifiedLeads: country.qualifiedLeads,
        conversionRate: parseFloat(country.conversionRate),
        userCount: country.users.length,
        avgLeadsPerUser:
          country.users.length > 0
            ? (country.totalLeads / country.users.length).toFixed(1)
            : "0",
      }));

    // Calculate totals for context
    const totalLeads = countriesData.reduce(
      (sum: number, country: any) => sum + country.totalLeads,
      0
    );
    const totalQualified = countriesData.reduce(
      (sum: number, country: any) => sum + country.qualifiedLeads,
      0
    );
    const overallConversionRate =
      totalLeads > 0 ? ((totalQualified / totalLeads) * 100).toFixed(1) : "0";

    return NextResponse.json({
      success: true,
      data: {
        countries: countriesData,
        summary: {
          totalCountries: countriesData.length,
          totalLeads,
          totalQualified,
          overallConversionRate: parseFloat(overallConversionRate),
        },
        period: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching leads countries performance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener performance por país",
      },
      { status: 500 }
    );
  }
}
