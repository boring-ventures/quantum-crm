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
  currency: z.enum(["BOB", "USD", "USDT"]).optional(),
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
        const createdQuotation = await tx.quotation.create({
          data: {
            leadId: validatedData.leadId,
            totalAmount: validatedData.totalAmount,
            proformaUrl: validatedData.proformaUrl,
            additionalNotes: validatedData.additionalNotes,
            status: "COMPLETED",
            currency: validatedData.currency || "BOB",
          },
        });

        // Si hay productos, crear los registros de QuotationProduct manualmente
        if (validatedData.products && validatedData.products.length > 0) {
          // Crear un array de consultas SQL para insertar los productos
          for (const product of validatedData.products) {
            await tx.$executeRaw`
              INSERT INTO quotation_products (
                id, quotation_id, product_id, quantity, price, created_at, updated_at
              ) VALUES (
                uuid_generate_v4(),
                ${createdQuotation.id},
                ${product.id},
                ${product.quantity},
                ${product.price},
                NOW(),
                NOW()
              );
            `;
          }
        }

        return createdQuotation;
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
