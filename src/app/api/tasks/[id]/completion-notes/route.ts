import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para las notas de finalización
const updateCompletionNotesSchema = z.object({
  completionNotes: z
    .string()
    .min(1, "Las notas de finalización son requeridas"),
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

    const taskId = params.id;

    // Buscar la tarea
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        lead: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const { completionNotes } = updateCompletionNotesSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validationError.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Error de validación" },
        { status: 400 }
      );
    }

    // Actualizar las notas de finalización
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completionNotes: body.completionNotes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: "Notas de finalización actualizadas correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar notas de finalización:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
