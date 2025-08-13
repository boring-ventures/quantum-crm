import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const assignedToId = searchParams.get("assignedToId");
    const countryId = searchParams.get("countryId");

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.lead = {
        product: {
          businessType: {
            id: category,
          },
        },
      };
    }

    if (assignedToId) {
      where.lead = {
        ...where.lead,
        assignedToId,
      };
    }

    if (countryId) {
      where.lead = {
        ...where.lead,
        assignedTo: {
          countryId,
        },
      };
    }

    if (search) {
      const searchConditions = [
        {
          lead: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          lead: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          lead: {
            product: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];

      if (where.lead) {
        const leadFilters = { ...where.lead };
        where.lead = undefined;
        where.AND = [{ lead: leadFilters }, { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            product: {
              select: {
                id: true,
                name: true,
                nameProduct: true,
                code: true,
                businessType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        quotationProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameProduct: true,
                code: true,
                businessType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    );
  }
}
