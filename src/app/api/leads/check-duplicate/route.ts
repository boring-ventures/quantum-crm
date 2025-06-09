import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Por simplicidad, asumimos que el token es válido por ahora
    // TODO: Implementar verificación de JWT adecuada

    const { searchParams } = new URL(req.url);
    const cellphone = searchParams.get("cellphone");

    if (!cellphone) {
      return NextResponse.json({ error: "Celular requerido" }, { status: 400 });
    }

    // Buscar leads con el mismo número de celular
    const duplicateLeads = await prisma.lead.findMany({
      where: {
        cellphone: cellphone,
        isArchived: false, // Solo buscar en leads activos
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(duplicateLeads);
  } catch (error) {
    console.error("[CHECK_DUPLICATE_API]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
