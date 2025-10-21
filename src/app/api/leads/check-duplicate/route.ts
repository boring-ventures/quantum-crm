import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Función auxiliar para buscar duplicados
async function findDuplicateLeads(cellphone: string) {
  return await prisma.lead.findMany({
    where: {
      cellphone: cellphone,
      isArchived: false, // Solo buscar en leads no archivados (incluye activos y cerrados)
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
      source: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("[CHECK_DUPLICATE_API] Recibida solicitud GET:", req.url);

    const { searchParams } = new URL(req.url);
    const cellphone = searchParams.get("cellphone");

    console.log("[CHECK_DUPLICATE_API] Celular recibido (GET):", cellphone);

    if (!cellphone) {
      console.log("[CHECK_DUPLICATE_API] Error: Celular no proporcionado");
      return NextResponse.json({ error: "Celular requerido" }, { status: 400 });
    }

    const duplicateLeads = await findDuplicateLeads(cellphone);

    console.log(
      "[CHECK_DUPLICATE_API] Leads encontrados (GET):",
      duplicateLeads.length
    );
    return NextResponse.json(duplicateLeads);
  } catch (error) {
    console.error("[CHECK_DUPLICATE_API] Error (GET):", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("[CHECK_DUPLICATE_API] Recibida solicitud POST");

    const body = await req.json();
    const { cellphone } = body;

    console.log("[CHECK_DUPLICATE_API] Celular recibido:", cellphone);

    if (!cellphone) {
      console.log("[CHECK_DUPLICATE_API] Error: Celular no proporcionado");
      return NextResponse.json({ error: "Celular requerido" }, { status: 400 });
    }

    const duplicateLeads = await findDuplicateLeads(cellphone);

    console.log(
      "[CHECK_DUPLICATE_API] Leads encontrados (POST):",
      duplicateLeads.length
    );
    return NextResponse.json(duplicateLeads);
  } catch (error) {
    console.error("[CHECK_DUPLICATE_API] Error (POST):", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
