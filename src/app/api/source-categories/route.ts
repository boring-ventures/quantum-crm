import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para la creación de categorías de fuentes
const createSourceCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// Obtener todas las categorías de fuentes
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener las categorías activas ordenadas por nombre
    const categories = await prisma.sourceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching source categories:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías de fuentes" },
      { status: 500 }
    );
  }
}

// Crear una nueva categoría de fuente
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
      const validatedData = createSourceCategorySchema.parse(body);

      // Crear la categoría de fuente
      const category = await prisma.sourceCategory.create({
        data: validatedData,
      });

      return NextResponse.json(category, { status: 201 });
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
    console.error("Error creating source category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría de fuente" },
      { status: 500 }
    );
  }
}
