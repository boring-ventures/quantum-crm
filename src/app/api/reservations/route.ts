import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createReservationSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido"),
  quotationId: z.string().uuid("ID de cotización inválido").optional(),
  amount: z.number().positive("El monto de reserva debe ser mayor a cero"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "FINANCING"], {
    errorMap: () => ({ message: "Método de pago inválido" }),
  }),
  deliveryDate: z.date().or(z.string().datetime()),
  reservationFormUrl: z.string().url("URL del formulario inválida"),
  depositReceiptUrl: z.string().url("URL del comprobante de depósito inválida"),
  reservationContractUrl: z
    .string()
    .url("URL del contrato de reserva inválida")
    .optional(),
  vehicleDetails: z.string().optional(),
  additionalNotes: z.string().optional(),
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
      const validatedData = createReservationSchema.parse(body);

      // Convertir la fecha de entrega si es string
      const deliveryDate =
        validatedData.deliveryDate instanceof Date
          ? validatedData.deliveryDate
          : new Date(validatedData.deliveryDate);

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

      // Verificar si ya existe una reserva para este lead
      const existingReservation = await prisma.reservation.findFirst({
        where: {
          leadId: validatedData.leadId,
        },
      });

      if (existingReservation) {
        return NextResponse.json(
          { error: "Ya existe una reserva para este lead" },
          { status: 400 }
        );
      }

      // Crear la reserva
      const reservation = await prisma.reservation.create({
        data: {
          leadId: validatedData.leadId,
          quotationId: validatedData.quotationId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          deliveryDate: deliveryDate,
          reservationFormUrl: validatedData.reservationFormUrl,
          depositReceiptUrl: validatedData.depositReceiptUrl,
          reservationContractUrl: validatedData.reservationContractUrl,
          vehicleDetails: validatedData.vehicleDetails,
          additionalNotes: validatedData.additionalNotes,
          status: "COMPLETED",
        },
      });

      return NextResponse.json(reservation, { status: 201 });
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
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}
