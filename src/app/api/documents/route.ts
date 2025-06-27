import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Tipo para documento extendido con información de fuente
interface ExtendedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  leadId: string;
  createdAt: Date;
  updatedAt: Date;
  source: "document" | "quotation" | "reservation" | "sale";
}

const createDocumentSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido"),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.string().min(1, "El tipo es requerido"),
  size: z.number().int().positive("El tamaño debe ser mayor a cero"),
  url: z.string().url("URL inválida"),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const validatedData = createDocumentSchema.parse(body);

      // Crear el documento
      await prisma.$executeRaw`
        INSERT INTO documents (
          id, lead_id, name, type, size, url, created_at, updated_at
        ) VALUES (
          uuid_generate_v4(), 
          ${validatedData.leadId}, 
          ${validatedData.name}, 
          ${validatedData.type}, 
          ${validatedData.size}, 
          ${validatedData.url}, 
          NOW(), 
          NOW()
        )
        RETURNING *;
      `;

      // Consultar el documento recién creado
      const result = await prisma.$queryRaw`
        SELECT * FROM documents 
        WHERE lead_id = ${validatedData.leadId}
        ORDER BY created_at DESC 
        LIMIT 1;
      `;

      const documentData = Array.isArray(result) ? result[0] : result;

      // Responder con el documento creado
      return NextResponse.json(documentData, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Error al crear el documento" },
      { status: 500 }
    );
  }
}

// Nuevo método GET para obtener documentos por leadId
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    if (!leadId) {
      return NextResponse.json(
        { error: "leadId es requerido" },
        { status: 400 }
      );
    }

    // Obtener documentos de la tabla documents
    const documents = await prisma.document.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });

    // Obtener documentos de quotations
    const quotations = await prisma.quotation.findMany({
      where: {
        leadId,
        proformaUrl: { not: null },
      },
      select: {
        id: true,
        proformaUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Obtener documentos de reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        leadId,
        OR: [
          { reservationFormUrl: { not: null } },
          { depositReceiptUrl: { not: null } },
          { reservationContractUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        reservationFormUrl: true,
        depositReceiptUrl: true,
        reservationContractUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Obtener documentos de sales
    const sales = await prisma.sale.findMany({
      where: {
        leadId,
        OR: [
          { saleContractUrl: { not: null } },
          { invoiceUrl: { not: null } },
          { paymentReceiptUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        saleContractUrl: true,
        invoiceUrl: true,
        paymentReceiptUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convertir documentos de quotations al formato estándar
    const quotationDocs = quotations.flatMap((q) => {
      const docs: ExtendedDocument[] = [];
      if (q.proformaUrl) {
        // Extraer el nombre del archivo de la URL
        const fileName = q.proformaUrl.split("/").pop() || "Proforma";
        docs.push({
          id: `quotation-${q.id}`,
          name: `Proforma - ${fileName}`,
          type: "application/pdf",
          size: 0, // No tenemos el tamaño
          url: q.proformaUrl,
          leadId,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          source: "quotation",
        });
      }
      return docs;
    });

    // Convertir documentos de reservations al formato estándar
    const reservationDocs = reservations.flatMap((r) => {
      const docs: ExtendedDocument[] = [];
      if (r.reservationFormUrl) {
        const fileName =
          r.reservationFormUrl.split("/").pop() || "Formulario de Reserva";
        docs.push({
          id: `reservation-form-${r.id}`,
          name: `Formulario de Reserva - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: r.reservationFormUrl,
          leadId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          source: "reservation",
        });
      }
      if (r.depositReceiptUrl) {
        const fileName =
          r.depositReceiptUrl.split("/").pop() || "Comprobante de Depósito";
        docs.push({
          id: `deposit-receipt-${r.id}`,
          name: `Comprobante de Depósito - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: r.depositReceiptUrl,
          leadId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          source: "reservation",
        });
      }
      if (r.reservationContractUrl) {
        const fileName =
          r.reservationContractUrl.split("/").pop() || "Contrato de Reserva";
        docs.push({
          id: `reservation-contract-${r.id}`,
          name: `Contrato de Reserva - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: r.reservationContractUrl,
          leadId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          source: "reservation",
        });
      }
      return docs;
    });

    // Convertir documentos de sales al formato estándar
    const saleDocs = sales.flatMap((s) => {
      const docs: ExtendedDocument[] = [];
      if (s.saleContractUrl) {
        const fileName =
          s.saleContractUrl.split("/").pop() || "Contrato de Venta";
        docs.push({
          id: `sale-contract-${s.id}`,
          name: `Contrato de Venta - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: s.saleContractUrl,
          leadId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          source: "sale",
        });
      }
      if (s.invoiceUrl) {
        const fileName = s.invoiceUrl.split("/").pop() || "Factura";
        docs.push({
          id: `invoice-${s.id}`,
          name: `Factura - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: s.invoiceUrl,
          leadId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          source: "sale",
        });
      }
      if (s.paymentReceiptUrl) {
        const fileName =
          s.paymentReceiptUrl.split("/").pop() || "Comprobante de Pago";
        docs.push({
          id: `payment-receipt-${s.id}`,
          name: `Comprobante de Pago - ${fileName}`,
          type: "application/pdf",
          size: 0,
          url: s.paymentReceiptUrl,
          leadId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          source: "sale",
        });
      }
      return docs;
    });

    // Marcar documentos de la tabla documents como fuente 'document'
    const standardDocs: ExtendedDocument[] = documents.map((doc) => ({
      ...doc,
      source: "document" as const,
    }));

    // Combinar todos los documentos y ordenar por fecha de creación
    const allDocuments = [
      ...standardDocs,
      ...quotationDocs,
      ...reservationDocs,
      ...saleDocs,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allDocuments);
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return NextResponse.json(
      { error: "Error al obtener documentos" },
      { status: 500 }
    );
  }
}
