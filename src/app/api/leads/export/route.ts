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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const assignedToId = searchParams.get("assignedToId");
    const isArchived = searchParams.get("isArchived");
    const isClosed = searchParams.get("isClosed");

    // Construir condiciones de filtro
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cellphone: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.statusId = status;
    }

    if (source) {
      where.sourceId = source;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (isArchived === "true") {
      where.isArchived = true;
    } else if (isArchived === "false") {
      where.isArchived = false;
    }

    if (isClosed === "true") {
      where.isClosed = true;
    } else if (isClosed === "false") {
      where.isClosed = false;
    }

    // Obtener los leads con relaciones
    const leads = await prisma.lead.findMany({
      where,
      include: {
        status: {
          select: {
            name: true,
          },
        },
        source: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convertir a CSV
    if (format === "csv") {
      const headers = [
        "ID",
        "Nombre",
        "Apellido",
        "Email",
        "Teléfono",
        "Celular",
        "Estado",
        "Fuente",
        "Asignado a",
        "Comentarios",
        "Fecha de creación",
        "Última actualización",
      ];

      const csvContent = [
        headers.join(","),
        ...leads.map((lead) =>
          [
            lead.id,
            `"${lead.firstName || ""}"`,
            `"${lead.lastName || ""}"`,
            `"${lead.email || ""}"`,
            `"${lead.phone || ""}"`,
            `"${lead.cellphone || ""}"`,
            `"${lead.status?.name || ""}"`,
            `"${lead.source?.name || ""}"`,
            `"${lead.assignedTo?.name || ""}"`,
            `"${(lead.extraComments || "").replace(/"/g, '""')}"`,
            new Date(lead.createdAt).toISOString(),
            new Date(lead.updatedAt).toISOString(),
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Para Excel, simplemente retornamos JSON por ahora
    // En producción se podría usar una librería como xlsx
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[EXPORT_LEADS_API]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
