import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const businessTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessTypes = await prisma.businessType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(businessTypes);
  } catch (error) {
    console.error("Error fetching business types:", error);
    return NextResponse.json(
      { error: "Error al obtener los tipos de negocio" },
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
      const validatedData = businessTypeSchema.parse(body);

      // Verificar si ya existe un tipo de negocio con el mismo nombre
      const existingBusinessType = await prisma.businessType.findUnique({
        where: { name: validatedData.name },
      });

      if (existingBusinessType) {
        return NextResponse.json(
          { error: "Ya existe un tipo de negocio con este nombre" },
          { status: 400 }
        );
      }

      // Crear el tipo de negocio
      const businessType = await prisma.businessType.create({
        data: validatedData,
      });

      return NextResponse.json(businessType, { status: 201 });
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
    console.error("Error creating business type:", error);
    return NextResponse.json(
      { error: "Error al crear el tipo de negocio" },
      { status: 500 }
    );
  }
}
