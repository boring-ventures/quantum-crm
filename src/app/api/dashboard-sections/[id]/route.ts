import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Esquema de validación para actualizar una sección del dashboard
const updateSectionSchema = z.object({
  key: z.string().min(1, "La clave es requerida").optional(),
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  url: z.string().min(1, "La URL es requerida").optional(),
  parentKey: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/dashboard-sections/[id] - Obtener una sección específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const section = await prisma.dashboardSection.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Sección no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: section }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard section:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la sección del dashboard" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard-sections/[id] - Actualizar una sección
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validar datos de entrada
    const result = updateSectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.format() },
        { status: 400 }
      );
    }

    // Verificar que la sección existe
    const existingSection = await prisma.dashboardSection.findUnique({
      where: { id },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: "Sección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la clave sea única si se está actualizando
    if (result.data.key && result.data.key !== existingSection.key) {
      const keyExists = await prisma.dashboardSection.findUnique({
        where: { key: result.data.key },
      });

      if (keyExists) {
        return NextResponse.json(
          { success: false, error: "Ya existe una sección con esta clave" },
          { status: 400 }
        );
      }
    }

    // Verificar parentKey si se proporciona
    if (result.data.parentKey) {
      const parentExists = await prisma.dashboardSection.findUnique({
        where: { key: result.data.parentKey },
      });

      if (!parentExists) {
        return NextResponse.json(
          { success: false, error: "La sección padre no existe" },
          { status: 400 }
        );
      }
    }

    // Actualizar la sección
    const updatedSection = await prisma.dashboardSection.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(
      { success: true, data: updatedSection },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating dashboard section:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la sección del dashboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard-sections/[id] - Eliminar una sección
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que la sección existe
    const existingSection = await prisma.dashboardSection.findUnique({
      where: { id },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: "Sección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay secciones hijas que dependen de esta
    const childSections = await prisma.dashboardSection.findMany({
      where: { parentKey: existingSection.key },
    });

    if (childSections.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar la sección porque hay secciones hijas que dependen de ella",
        },
        { status: 400 }
      );
    }

    // Eliminar la sección
    await prisma.dashboardSection.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Sección eliminada con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting dashboard section:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la sección del dashboard" },
      { status: 500 }
    );
  }
}
