import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos para los filtros
    const [brands, businessTypes] = await Promise.all([
      // Marcas activas
      prisma.brand.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      }),

      // Tipos de negocio activos
      prisma.businessType.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      brands,
      businessTypes,
    });
  } catch (error) {
    console.error("[DASHBOARD_FILTERS]", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
