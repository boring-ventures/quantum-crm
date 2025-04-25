import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para actualización de leads
const updateLeadSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").optional(),
  lastName: z.string().min(1, "El apellido es requerido").optional(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  statusId: z.string().uuid("ID de estado inválido").optional(),
  sourceId: z.string().uuid("ID de fuente inválido").optional(),
  assignedToId: z.string().uuid("ID de usuario inválido").optional().nullable(),
  interest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Función para verificar si un lead existe
async function leadExists(id: string) {
  const count = await prisma.lead.count({
    where: { id },
  });
  return count > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Obtener el lead con sus relaciones
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        status: true,
        source: true,
        assignedTo: true,
        tags: {
          include: {
            tag: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Transformar los datos para que coincidan con la interfaz LeadWithRelations
    const formattedLead = {
      ...lead,
      tags: lead.tags.map((lt: any) => lt.tag),
    };

    return NextResponse.json(formattedLead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Error al obtener el lead" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Verificar si el lead existe
    if (!(await leadExists(id))) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const validatedData = updateLeadSchema.parse(body);

      // Actualizar el lead
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: validatedData,
        include: {
          status: true,
          source: true,
          assignedTo: true,
        },
      });

      return NextResponse.json(updatedLead);
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
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Error al actualizar el lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    // Verificar si el lead existe
    if (!(await leadExists(id))) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el lead y sus relaciones usando cascada definida en el esquema
    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Error al eliminar el lead" },
      { status: 500 }
    );
  }
}
