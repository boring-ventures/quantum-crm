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

    const leadId = params.id;

    // Buscar cotización existente para este lead
    const quotation = await prisma.$queryRaw`
      SELECT * FROM quotations
      WHERE lead_id = ${leadId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!quotation || (Array.isArray(quotation) && quotation.length === 0)) {
      return NextResponse.json(
        { error: "No se encontró cotización para este lead" },
        { status: 404 }
      );
    }

    // Si quotation es un array, devolver el primer elemento
    const result = Array.isArray(quotation) ? quotation[0] : quotation;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener cotización:", error);
    return NextResponse.json(
      { error: "Error al obtener cotización" },
      { status: 500 }
    );
  }
}
