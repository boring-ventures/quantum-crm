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
    const raw = Array.isArray(quotation) ? quotation[0] : quotation;

    // Mapear a camelCase
    const result = {
      id: raw.id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      leadId: raw.lead_id,
      totalAmount: raw.total_amount,
      proformaUrl: raw.proforma_url,
      additionalNotes: raw.additional_notes,
      status: raw.status,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener cotización:", error);
    return NextResponse.json(
      { error: "Error al obtener cotización" },
      { status: 500 }
    );
  }
}
