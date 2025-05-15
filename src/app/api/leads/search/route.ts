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

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Términos de búsqueda insuficientes" },
        { status: 400 }
      );
    }

    // Buscar leads (no archivados) que coincidan con el término de búsqueda
    const leads = await prisma.lead.findMany({
      where: {
        isArchived: false,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10, // Limitar resultados
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error searching leads:", error);
    return NextResponse.json(
      { error: "Error al buscar leads" },
      { status: 500 }
    );
  }
}
