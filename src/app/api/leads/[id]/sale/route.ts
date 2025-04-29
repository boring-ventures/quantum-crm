import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del lead desde los parámetros de ruta (await)
    const { id: leadId } = await params;

    if (!leadId) {
      return NextResponse.json(
        { error: "ID de lead no válido" },
        { status: 400 }
      );
    }

    // Buscar venta existente para este lead
    const sale = await prisma.sale.findFirst({
      where: {
        leadId: leadId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "No se encontró venta para este lead" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error al obtener venta:", error);
    return NextResponse.json(
      { error: "Error al obtener venta" },
      { status: 500 }
    );
  }
}
