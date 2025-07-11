import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search");
    const assignedToId = searchParams.get("assignedToId");
    const countryId = searchParams.get("countryId");
    const status = searchParams.get("status"); // active, closed, archived
    const qualityScore = searchParams.get("qualityScore");

    const where: Prisma.LeadWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (countryId) {
      where.assignedTo = {
        countryId: countryId,
      };
    }

    if (status === "active") {
      where.isArchived = false;
      where.isClosed = false;
    } else if (status === "closed") {
      where.isClosed = true;
      where.isArchived = false;
    } else if (status === "archived") {
      where.isArchived = true;
    }

    if (qualityScore && qualityScore !== "0") {
      where.qualityScore = parseInt(qualityScore, 10);
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { name: true, email: true } },
        product: { select: { name: true, code: true } },
        source: { select: { name: true } },
        status: { select: { name: true } },
        reassignments: {
          orderBy: { createdAt: "asc" },
          take: 1,
          include: {
            fromUser: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const dataForSheet = leads.map((lead) => {
      // Determinar el creador original
      let creatorName = "N/A";
      let creatorEmail = "N/A";

      if (lead.reassignments.length > 0) {
        // Si hay reasignaciones, el primer fromUser es el creador original
        creatorName = lead.reassignments[0].fromUser.name;
        creatorEmail = lead.reassignments[0].fromUser.email;
      } else {
        // Si no hay reasignaciones, el assignedTo actual es el creador
        creatorName = lead.assignedTo.name;
        creatorEmail = lead.assignedTo.email;
      }

      return {
        Nombre: lead.firstName,
        Apellido: lead.lastName,
        Email: lead.email,
        Teléfono: lead.phone,
        Celular: lead.cellphone,
        "Creado por": creatorName,
        "Email Creador": creatorEmail,
        Estado: lead.status.name,
        Fuente: lead.source.name,
        "Asignado a": lead.assignedTo.name,
        "Email Asignado": lead.assignedTo.email,
        Producto: lead.product?.name || "N/A",
        "Código de Producto": lead.product?.code || "N/A",
        "Puntuación de Calidad": lead.qualityScore,
        Calificación: lead.qualification,
        Archivado: lead.isArchived ? "Sí" : "No",
        Cerrado: lead.isClosed ? "Sí" : "No",
        "Fecha de Cierre": lead.closedAt?.toISOString() || "N/A",
        "Razón de Cierre": lead.reasonClosed || "N/A",
        "Fecha de Creación": lead.createdAt.toISOString(),
        "Última Actualización": lead.updatedAt.toISOString(),
        "Último Contacto": lead.lastContactedAt?.toISOString() || "N/A",
        "Próximo Seguimiento": lead.nextFollowUpDate?.toISOString() || "N/A",
        "Comentarios Extra": lead.extraComments,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const columnWidths = Object.keys(dataForSheet[0] || {}).map((key) => {
      let width = key.length;
      if (dataForSheet.length > 0) {
        const max = Math.max(
          ...dataForSheet.map(
            (row) => String(row[key as keyof typeof row] || "").length
          )
        );
        width = Math.max(width, max);
      }
      return { wch: width + 2 };
    });

    worksheet["!cols"] = columnWidths;

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const fileName = `quantum_crm_leads_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leads:", error);
    return NextResponse.json(
      { error: "Error al exportar los leads" },
      { status: 500 }
    );
  }
}
