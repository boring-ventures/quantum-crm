import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para actualización de categorías
const updateSourceCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Función para verificar si una categoría existe
async function categoryExists(id: string) {
  const count = await prisma.sourceCategory.count({
    where: { id },
  });
  return count > 0;
}

export async function GET(_req: Request, { params }: any) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Obtener la categoría con sus fuentes relacionadas
    const category = await prisma.sourceCategory.findUnique({
      where: { id },
      include: {
        sources: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching source category:", error);
    return NextResponse.json(
      { error: "Error al obtener la categoría" },
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

    // Verificar si la categoría existe
    if (!(await categoryExists(id))) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await req.json();

    try {
      const validatedData = updateSourceCategorySchema.parse(body);

      // Actualizar la categoría
      const updatedCategory = await prisma.sourceCategory.update({
        where: { id },
        data: validatedData,
      });

      return NextResponse.json(updatedCategory);
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
    console.error("Error updating source category:", error);
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: any) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Verificar si la categoría existe
    if (!(await categoryExists(id))) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay fuentes usando esta categoría
    const sourcesCount = await prisma.leadSource.count({
      where: { categoryId: id },
    });

    if (sourcesCount > 0) {
      // En lugar de eliminar, marcar como inactiva si tiene fuentes relacionadas
      const updatedCategory = await prisma.sourceCategory.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        ...updatedCategory,
        message:
          "Categoría marcada como inactiva ya que tiene fuentes relacionadas",
      });
    }

    // Eliminar la categoría si no tiene relaciones
    await prisma.sourceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting source category:", error);
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    );
  }
}
