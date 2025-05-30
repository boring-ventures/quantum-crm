import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todas las secciones activas
    const sections = await prisma.dashboardSection.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error al obtener secciones del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener secciones" },
      { status: 500 }
    );
  }
}
