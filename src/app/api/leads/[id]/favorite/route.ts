import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para marcar como favorito
const toggleFavoriteSchema = z.object({
  isFavorite: z.boolean(),
  favoriteAt: z.string().datetime().nullable().optional(),
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

    // Obtener y validar el leadId
    const { id: leadId } = params;

    if (!leadId) {
      return NextResponse.json(
        { error: "ID de lead no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener y validar el cuerpo de la petición
    const body = await request.json();

    try {
      const { isFavorite, favoriteAt } = toggleFavoriteSchema.parse(body);

      // Actualizar el lead
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          isFavorite,
          favoriteAt: isFavorite ? favoriteAt || new Date() : null,
        },
      });

      return NextResponse.json(updatedLead);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Datos de favorito inválidos",
            details: validationError.format(),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error al actualizar favorito:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de favorito" },
      { status: 500 }
    );
  }
}
