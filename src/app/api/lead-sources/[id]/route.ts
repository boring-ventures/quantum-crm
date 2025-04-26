import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para actualización
const updateLeadSourceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid("ID de categoría inválido").optional().nullable(),
  costPerLead: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Función para verificar si una fuente existe
async function sourceExists(id: string) {
  const count = await prisma.leadSource.count({
    where: { id },
  });
  return count > 0;
}

export async function GET(req: Request, { params }: any) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Obtener la fuente con su categoría relacionada
    const source = await prisma.leadSource.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Fuente no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error fetching lead source:", error);
    return NextResponse.json(
      { error: "Error al obtener la fuente" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: any) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Verificar si la fuente existe
    if (!(await sourceExists(id))) {
      return NextResponse.json(
        { error: "Fuente no encontrada" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await req.json();

    try {
      const validatedData = updateLeadSourceSchema.parse(body);

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

      // Actualizar la fuente
      const updatedSource = await prisma.leadSource.update({
        where: { id },
        data: validatedData,
        include: {
          category: true,
        },
      });

      return NextResponse.json(updatedSource);
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
    console.error("Error updating lead source:", error);
    return NextResponse.json(
      { error: "Error al actualizar la fuente" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: any) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Verificar si la fuente existe
    if (!(await sourceExists(id))) {
      return NextResponse.json(
        { error: "Fuente no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay leads usando esta fuente
    const leadsCount = await prisma.lead.count({
      where: { sourceId: id },
    });

    if (leadsCount > 0) {
      // En lugar de eliminar, marcar como inactiva si tiene leads relacionados
      const updatedSource = await prisma.leadSource.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        ...updatedSource,
        message: "Fuente marcada como inactiva ya que tiene leads relacionados",
      });
    }

    // Eliminar la fuente si no tiene relaciones
    await prisma.leadSource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead source:", error);
    return NextResponse.json(
      { error: "Error al eliminar la fuente" },
      { status: 500 }
    );
  }
}
