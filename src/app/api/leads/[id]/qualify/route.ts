import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para la calificación de leads
const qualifyLeadSchema = z.object({
  qualification: z.enum(["NOT_QUALIFIED", "GOOD_LEAD", "BAD_LEAD"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del lead
    const { id } = params;

    // Verificar si el lead existe
    const leadExists = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const { qualification } = qualifyLeadSchema.parse(body);

      // Si se marca como BAD_LEAD, también lo archivamos
      const isArchived = qualification === "BAD_LEAD";

      // Actualizar el lead con la calificación usando prisma.lead.update
      await prisma.lead.update({
        where: { id },
        data: {
          qualification,
          isArchived,
        },
      });

      return NextResponse.json({
        success: true,
        qualification,
        isArchived,
      });
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
    console.error("Error al calificar lead:", error);
    return NextResponse.json(
      { error: "Error al calificar el lead" },
      { status: 500 }
    );
  }
}
