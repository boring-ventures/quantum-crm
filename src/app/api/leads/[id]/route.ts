import { NextResponse } from "next/server";
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del lead desde los parámetros de ruta (await)
    const { id } = await params;

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
        tasks: true,
        quotations: true,
        reservations: true,
        sales: true,
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del lead desde los parámetros de ruta (await)
    const { id } = await params;

    // Verificar si el lead existe
    if (!(await leadExists(id))) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await req.json();

    try {
      const validatedData = updateLeadSchema.parse(body);

      // Actualizar el lead - asegurándonos de que los tipos sean compatibles con Prisma
      const data: Record<string, any> = {};

      // Solo agregar los campos que están definidos en validatedData
      if (validatedData.firstName !== undefined)
        data.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined)
        data.lastName = validatedData.lastName;
      if (validatedData.email !== undefined) data.email = validatedData.email;
      if (validatedData.phone !== undefined) data.phone = validatedData.phone;
      if (validatedData.company !== undefined)
        data.company = validatedData.company;
      if (validatedData.statusId !== undefined)
        data.statusId = validatedData.statusId;
      if (validatedData.sourceId !== undefined)
        data.sourceId = validatedData.sourceId;
      if (validatedData.assignedToId !== undefined)
        data.assignedToId = validatedData.assignedToId;
      if (validatedData.interest !== undefined)
        data.interest = validatedData.interest;
      if (validatedData.notes !== undefined) data.notes = validatedData.notes;

      const updatedLead = await prisma.lead.update({
        where: { id },
        data,
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del lead desde los parámetros de ruta (await)
    const { id } = await params;

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
