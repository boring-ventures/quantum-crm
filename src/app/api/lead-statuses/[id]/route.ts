import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para actualización
const updateLeadStatusSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  description: z.string().optional().nullable(),
  color: z.string().min(1, "El color es requerido").optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

// Función para verificar si un estado existe
async function statusExists(id: string) {
  const count = await prisma.leadStatus.count({
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

    // Obtener el estado
    const status = await prisma.leadStatus.findUnique({
      where: { id },
      include: {
        leads: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          take: 10,
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!status) {
      return NextResponse.json(
        { error: "Estado no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching lead status:", error);
    return NextResponse.json(
      { error: "Error al obtener el estado" },
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

    // Verificar si el estado existe
    if (!(await statusExists(id))) {
      return NextResponse.json(
        { error: "Estado no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await req.json();

    try {
      const validatedData = updateLeadStatusSchema.parse(body);

      // Si se actualiza el nombre, verificar que no exista otro con ese nombre
      if (validatedData.name) {
        const existingStatus = await prisma.leadStatus.findFirst({
          where: {
            name: validatedData.name,
            id: { not: id },
          },
        });

        if (existingStatus) {
          return NextResponse.json(
            { error: "Ya existe otro estado con este nombre" },
            { status: 400 }
          );
        }
      }

      // Actualizar el estado
      const updatedStatus = await prisma.leadStatus.update({
        where: { id },
        data: validatedData,
      });

      return NextResponse.json(updatedStatus);
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
    console.error("Error updating lead status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
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

    // Verificar si el estado existe
    if (!(await statusExists(id))) {
      return NextResponse.json(
        { error: "Estado no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay leads usando este estado
    const leadsCount = await prisma.lead.count({
      where: { statusId: id },
    });

    if (leadsCount > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el estado porque hay leads asociados",
          leadsCount,
        },
        { status: 400 }
      );
    }

    // Eliminar el estado si no tiene leads asociados
    await prisma.leadStatus.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead status:", error);
    return NextResponse.json(
      { error: "Error al eliminar el estado" },
      { status: 500 }
    );
  }
}
