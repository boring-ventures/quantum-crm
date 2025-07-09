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
    const assignedToIds = searchParams
      .get("assignedToIds")
      ?.split(",")
      .filter(Boolean);
    const leadCategory = searchParams.get("leadCategory");
    const groupBy = searchParams.get("groupBy") || "product"; // product, businessType, brand

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
      productId: {
        not: null, // Only include leads with products
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

    if (assignedToIds?.length) {
      whereClause.assignedToId = { in: assignedToIds };
    }

    switch (leadCategory) {
      case "withoutTasks":
        whereClause.tasks = { none: {} };
        break;
      case "unmanaged":
        whereClause.AND = [
          { quotations: { none: {} } },
          { reservations: { none: {} } },
          { sales: { none: {} } },
        ];
        break;
      case "closed":
        whereClause.isClosed = true;
        break;
      case "archived":
        whereClause.isArchived = true;
        break;
    }

    // Get leads grouped by product
    const leadsGroupedByProduct = await prisma.lead.groupBy({
      by: ["productId"],
      where: whereClause,
      _count: { productId: true },
    });

    // Get product details with business types and brands
    const productIds = leadsGroupedByProduct
      .map((item) => item.productId)
      .filter(Boolean) as string[];

    const productsWithDetails = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        businessType: {
          select: {
            name: true,
          },
        },
        brand: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get qualified leads count by product
    const qualifiedLeadsByProduct = await prisma.lead.groupBy({
      by: ["productId"],
      where: {
        ...whereClause,
        qualification: "GOOD_LEAD",
      },
      _count: { productId: true },
    });

    // Create qualified leads lookup
    const qualifiedLookup = qualifiedLeadsByProduct.reduce(
      (acc, item) => {
        if (item.productId) {
          acc[item.productId] = item._count.productId;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Process data based on groupBy parameter
    let processedData: any[] = [];

    if (groupBy === "product") {
      processedData = leadsGroupedByProduct.map((item) => {
        const product = productsWithDetails.find(
          (p) => p.id === item.productId
        );
        const qualifiedCount = qualifiedLookup[item.productId!] || 0;
        const conversionRate =
          item._count.productId > 0
            ? ((qualifiedCount / item._count.productId) * 100).toFixed(1)
            : "0";

        return {
          id: item.productId,
          name: product?.name || "Producto desconocido",
          businessType: product?.businessType?.name || "Sin tipo",
          brand: product?.brand?.name || "Sin marca",
          totalLeads: item._count.productId,
          qualifiedLeads: qualifiedCount,
          conversionRate: parseFloat(conversionRate),
          avgPrice: product?.price
            ? parseFloat(product.price.toString())
            : null,
        };
      });
    } else if (groupBy === "businessType") {
      // Group by business type
      const businessTypeAggregation = leadsGroupedByProduct.reduce(
        (acc, item) => {
          const product = productsWithDetails.find(
            (p) => p.id === item.productId
          );
          const businessTypeName = product?.businessType?.name || "Sin tipo";

          if (!acc[businessTypeName]) {
            acc[businessTypeName] = {
              name: businessTypeName,
              totalLeads: 0,
              qualifiedLeads: 0,
              products: [],
            };
          }

          acc[businessTypeName].totalLeads += item._count.productId;
          acc[businessTypeName].qualifiedLeads +=
            qualifiedLookup[item.productId!] || 0;
          acc[businessTypeName].products.push(product?.name || "Desconocido");

          return acc;
        },
        {} as Record<string, any>
      );

      processedData = Object.values(businessTypeAggregation).map(
        (type: any) => ({
          name: type.name,
          totalLeads: type.totalLeads,
          qualifiedLeads: type.qualifiedLeads,
          conversionRate:
            type.totalLeads > 0
              ? ((type.qualifiedLeads / type.totalLeads) * 100).toFixed(1)
              : "0",
          productCount: type.products.length,
        })
      );
    } else if (groupBy === "brand") {
      // Group by brand
      const brandAggregation = leadsGroupedByProduct.reduce(
        (acc, item) => {
          const product = productsWithDetails.find(
            (p) => p.id === item.productId
          );
          const brandName = product?.brand?.name || "Sin marca";

          if (!acc[brandName]) {
            acc[brandName] = {
              name: brandName,
              totalLeads: 0,
              qualifiedLeads: 0,
              products: [],
            };
          }

          acc[brandName].totalLeads += item._count.productId;
          acc[brandName].qualifiedLeads +=
            qualifiedLookup[item.productId!] || 0;
          acc[brandName].products.push(product?.name || "Desconocido");

          return acc;
        },
        {} as Record<string, any>
      );

      processedData = Object.values(brandAggregation).map((brand: any) => ({
        name: brand.name,
        totalLeads: brand.totalLeads,
        qualifiedLeads: brand.qualifiedLeads,
        conversionRate:
          brand.totalLeads > 0
            ? ((brand.qualifiedLeads / brand.totalLeads) * 100).toFixed(1)
            : "0",
        productCount: brand.products.length,
      }));
    }

    // Sort by total leads and take top 15
    const sortedData = processedData
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 15);

    // Calculate summary
    const totalLeads = sortedData.reduce(
      (sum, item) => sum + item.totalLeads,
      0
    );
    const totalQualified = sortedData.reduce(
      (sum, item) => sum + item.qualifiedLeads,
      0
    );
    const overallConversionRate =
      totalLeads > 0 ? ((totalQualified / totalLeads) * 100).toFixed(1) : "0";

    return NextResponse.json({
      success: true,
      data: {
        products: sortedData,
        summary: {
          totalProducts: sortedData.length,
          totalLeads,
          totalQualified,
          overallConversionRate: parseFloat(overallConversionRate),
        },
        groupBy,
        period: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching leads products analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener análisis por producto",
      },
      { status: 500 }
    );
  }
}
