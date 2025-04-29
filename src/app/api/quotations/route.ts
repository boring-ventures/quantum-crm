import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createQuotationSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido"),
  totalAmount: z.number().positive("El monto total debe ser mayor a cero"),
  proformaUrl: z.string().url("URL inválida").optional(),
  additionalNotes: z.string().optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .optional(),
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
      const validatedData = createQuotationSchema.parse(body);

      // Crear la cotización usando una transacción para asegurar consistencia
      const quotation = await prisma.$transaction(async (tx) => {
        // Crear la cotización
        await tx.$executeRaw`
          INSERT INTO quotations (
            id, lead_id, total_amount, proforma_url, additional_notes, status, created_at, updated_at
          ) VALUES (
            uuid_generate_v4(), 
            ${validatedData.leadId}, 
            ${validatedData.totalAmount}, 
            ${validatedData.proformaUrl || null}, 
            ${validatedData.additionalNotes || null}, 
            'COMPLETED', 
            NOW(), 
            NOW()
          )
          RETURNING *;
        `;

        // Consultar la cotización recién creada
        const result = await tx.$queryRaw`
          SELECT * FROM quotations 
          WHERE lead_id = ${validatedData.leadId}
          ORDER BY created_at DESC 
          LIMIT 1;
        `;

        return Array.isArray(result) ? result[0] : result;
      });

      // Responder con la cotización creada
      return NextResponse.json(quotation, { status: 201 });
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
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Error al crear la cotización" },
      { status: 500 }
    );
  }
}
