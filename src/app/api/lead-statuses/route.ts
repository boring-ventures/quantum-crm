import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para crear un estado de lead
const createLeadStatusSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  color: z.string().min(1, "El color es requerido"),
  displayOrder: z.number().int().nonnegative(),
});

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los estados de leads ordenados por displayOrder
    const statuses = await prisma.leadStatus.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching lead statuses:", error);
    return NextResponse.json(
      { error: "Error al obtener los estados de leads" },
      { status: 500 }
    );
  }
}

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
      // Procesar los datos antes de validar si el displayOrder no existe
      const dataToValidate = { ...body };

      // Si no se proporciona displayOrder, obtener el máximo actual y sumar 1
      if (dataToValidate.displayOrder === undefined) {
        const maxOrderStatus = await prisma.leadStatus.findFirst({
          orderBy: { displayOrder: "desc" },
        });

        dataToValidate.displayOrder = maxOrderStatus
          ? maxOrderStatus.displayOrder + 1
          : 0;
      }

      const validatedData = createLeadStatusSchema.parse(dataToValidate);

      // Comprobar si ya existe un estado con el mismo nombre
      const existingStatus = await prisma.leadStatus.findUnique({
        where: { name: validatedData.name },
      });

      if (existingStatus) {
        return NextResponse.json(
          { error: "Ya existe un estado con este nombre" },
          { status: 400 }
        );
      }

      // Crear el estado de lead
      const status = await prisma.leadStatus.create({
        data: validatedData,
      });

      return NextResponse.json(status, { status: 201 });
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
    console.error("Error creating lead status:", error);
    return NextResponse.json(
      { error: "Error al crear el estado de lead" },
      { status: 500 }
    );
  }
}
