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

    // Buscar reserva existente para este lead
    const reservation = await prisma.reservation.findFirst({
      where: {
        leadId: leadId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "No se encontró reserva para este lead" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error al obtener reserva:", error);
    return NextResponse.json(
      { error: "Error al obtener reserva" },
      { status: 500 }
    );
  }
}
