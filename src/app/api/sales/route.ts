import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSaleSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido"),
  reservationId: z.string().uuid("ID de reserva inválido").optional(),
  amount: z.number().positive("El monto de venta debe ser mayor a cero"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "FINANCING"], {
    errorMap: () => ({ message: "Método de pago inválido" }),
  }),
  saleContractUrl: z
    .string()
    .url("URL del contrato de venta inválida")
    .optional(),
  invoiceUrl: z.string().url("URL de la factura inválida"),
  paymentReceiptUrl: z.string().url("URL del comprobante de pago inválida"),
  additionalNotes: z.string().optional(),
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
      const validatedData = createSaleSchema.parse(body);

      // Verificar si existe el lead
      const lead = await prisma.lead.findUnique({
        where: { id: validatedData.leadId },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "El lead especificado no existe" },
          { status: 400 }
        );
      }

      // Verificar si ya existe una venta para este lead
      const existingSale = await prisma.sale.findFirst({
        where: {
          leadId: validatedData.leadId,
        },
      });

      if (existingSale) {
        return NextResponse.json(
          { error: "Ya existe una venta para este lead" },
          { status: 400 }
        );
      }

      // Crear la venta
      const sale = await prisma.sale.create({
        data: {
          leadId: validatedData.leadId,
          reservationId: validatedData.reservationId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          saleContractUrl: validatedData.saleContractUrl,
          invoiceUrl: validatedData.invoiceUrl,
          paymentReceiptUrl: validatedData.paymentReceiptUrl,
          additionalNotes: validatedData.additionalNotes,
          currency: validatedData.currency || "BOB",
          status: "COMPLETED",
        },
      });

      return NextResponse.json(sale, { status: 201 });
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
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Error al crear la venta" },
      { status: 500 }
    );
  }
}
