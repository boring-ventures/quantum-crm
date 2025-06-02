import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const assignedToId = searchParams.get("assignedToId");

    // Construir condiciones de filtrado
    const where: any = {};

    // Filtrar por rango de fechas
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Filtrar por estado
    if (status) {
      where.status = status;
    }

    // Buscar por categoría de producto
    if (category) {
      where.lead = {
        product: {
          businessType: {
            id: category,
          },
        },
      };
    }

    // Filtrar por vendedor asignado
    if (assignedToId) {
      where.lead = {
        ...where.lead,
        assignedToId: assignedToId,
      };
    }

    // Buscar por texto
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

      // Si ya tenemos condiciones para lead, las integramos con OR
      if (where.lead) {
        const leadFilters = { ...where.lead };
        where.lead = undefined;

        where.AND = [{ lead: leadFilters }, { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }

    // Obtener ventas con relaciones
    const sales = await prisma.sale.findMany({
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
        reservation: {
          include: {
            quotation: {
              include: {
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
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}
