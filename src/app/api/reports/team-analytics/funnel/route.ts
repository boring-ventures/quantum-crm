import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const userIds = searchParams.get("userIds")?.split(",").filter(Boolean);
    const roleFilter = searchParams.get("role");

    // Default to last 30 days
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(subDays(defaultEndDate, 30));

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Build user filter
    const userWhere: any = {
      isActive: true,
      isDeleted: false,
    };

    if (countryIds?.length) {
      userWhere.countryId = { in: countryIds };
    }

    if (userIds?.length) {
      userWhere.id = { in: userIds };
    }

    if (roleFilter) {
      userWhere.role = roleFilter;
    }

    // Get all team members
    const teamMembers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
      },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          funnels: [],
        },
      });
    }

    const userIds_list = teamMembers.map((u) => u.id);

    // OPTIMIZED: Single query for leads and qualified leads per user
    const leadsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        total_leads: bigint;
        qualified_leads: bigint;
      }>
    >(Prisma.sql`
      SELECT
        assigned_to_id,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN qualification = 'GOOD_LEAD' THEN 1 END) as qualified_leads
      FROM leads
      WHERE assigned_to_id IN (${Prisma.join(userIds_list)})
        AND created_at >= ${periodStart}
        AND created_at <= ${periodEnd}
      GROUP BY assigned_to_id
    `
    );

    // OPTIMIZED: Single query for quotations per user
    const quotationsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        quotation_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(q.id) as quotation_count
      FROM quotations q
      INNER JOIN leads l ON q.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND q.created_at >= ${periodStart}
        AND q.created_at <= ${periodEnd}
      GROUP BY l.assigned_to_id
    `
    );

    // OPTIMIZED: Single query for reservations per user
    const reservationsStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        reservation_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(r.id) as reservation_count
      FROM reservations r
      INNER JOIN leads l ON r.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND r.created_at >= ${periodStart}
        AND r.created_at <= ${periodEnd}
      GROUP BY l.assigned_to_id
    `
    );

    // OPTIMIZED: Single query for sales per user
    const salesStats = await prisma.$queryRaw<
      Array<{
        assigned_to_id: string;
        sales_count: bigint;
      }>
    >(Prisma.sql`
      SELECT
        l.assigned_to_id,
        COUNT(s.id) as sales_count
      FROM sales s
      INNER JOIN leads l ON s.lead_id = l.id
      WHERE l.assigned_to_id IN (${Prisma.join(userIds_list)})
        AND s.created_at >= ${periodStart}
        AND s.created_at <= ${periodEnd}
        AND s.approval_status = 'APPROVED'
      GROUP BY l.assigned_to_id
    `
    );

    // Build lookup maps for O(1) access
    const leadsMap = new Map(leadsStats.map((s) => [s.assigned_to_id, s]));
    const quotationsMap = new Map(quotationsStats.map((s) => [s.assigned_to_id, s]));
    const reservationsMap = new Map(reservationsStats.map((s) => [s.assigned_to_id, s]));
    const salesMap = new Map(salesStats.map((s) => [s.assigned_to_id, s]));

    // Build funnel data array
    const funnelData = teamMembers.map((user) => {
      const leads = leadsMap.get(user.id);
      const quotations = quotationsMap.get(user.id);
      const reservations = reservationsMap.get(user.id);
      const sales = salesMap.get(user.id);

      const totalLeads = Number(leads?.total_leads || 0);
      const qualifiedLeads = Number(leads?.qualified_leads || 0);
      const quotationCount = Number(quotations?.quotation_count || 0);
      const reservationCount = Number(reservations?.reservation_count || 0);
      const salesCount = Number(sales?.sales_count || 0);

      // Calculate conversion rates
      const leadToQualified =
        totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

      const qualifiedToQuotation =
        qualifiedLeads > 0 ? (quotationCount / qualifiedLeads) * 100 : 0;

      const quotationToReservation =
        quotationCount > 0 ? (reservationCount / quotationCount) * 100 : 0;

      const reservationToSale =
        reservationCount > 0 ? (salesCount / reservationCount) * 100 : 0;

      return {
        userId: user.id,
        name: user.name,
        stages: {
          leads: totalLeads,
          qualified: qualifiedLeads,
          quotations: quotationCount,
          reservations: reservationCount,
          sales: salesCount,
        },
        conversionRates: {
          leadToQualified: Number(leadToQualified.toFixed(2)),
          qualifiedToQuotation: Number(qualifiedToQuotation.toFixed(2)),
          quotationToReservation: Number(quotationToReservation.toFixed(2)),
          reservationToSale: Number(reservationToSale.toFixed(2)),
        },
      };
    });

    // Sort by total sales descending
    funnelData.sort((a, b) => b.stages.sales - a.stages.sales);

    return NextResponse.json({
      success: true,
      data: {
        funnels: funnelData,
      },
    });
  } catch (error) {
    console.error("Error fetching team funnel:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener embudo de conversión",
      },
      { status: 500 }
    );
  }
}
