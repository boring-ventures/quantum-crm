import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para marcar como favorito
const toggleFavoriteSchema = z.object({
  isFavorite: z.boolean(),
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
      const { isFavorite } = toggleFavoriteSchema.parse(body);

      // Actualizar el lead
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          isFavorite,
        },
      });

      return NextResponse.json({
        success: true,
        isFavorite,
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
    console.error("Error al actualizar favorito:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de favorito" },
      { status: 500 }
    );
  }
}
