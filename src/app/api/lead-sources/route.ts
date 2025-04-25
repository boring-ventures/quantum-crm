import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para crear una fuente
const createSourceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid("ID de categoría inválido").optional().nullable(),
  costPerLead: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Construir condiciones de búsqueda
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    // Obtener todas las fuentes de leads con su categoría
    const sources = await prisma.leadSource.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error fetching lead sources:", error);
    return NextResponse.json(
      { error: "Error al obtener las fuentes de leads" },
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
      const validatedData = createSourceSchema.parse(body);

      // Verificar que la categoría existe si se proporciona
      if (validatedData.categoryId) {
        const categoryExists = await prisma.sourceCategory.findUnique({
          where: { id: validatedData.categoryId },
        });

        if (!categoryExists) {
          return NextResponse.json(
            { error: "La categoría especificada no existe" },
            { status: 400 }
          );
        }
      }

      // Crear la fuente de lead
      const source = await prisma.leadSource.create({
        data: validatedData,
        include: {
          category: true,
        },
      });

      return NextResponse.json(source, { status: 201 });
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
    console.error("Error creating lead source:", error);
    return NextResponse.json(
      { error: "Error al crear la fuente de lead" },
      { status: 500 }
    );
  }
}
