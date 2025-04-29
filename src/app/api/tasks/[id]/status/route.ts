import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para la actualización de estado
const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
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
      const { status } = updateStatusSchema.parse(body);

      // Actualizar campos adicionales según el estado
      const updateData: any = { status };

      // Si se marca como completada, registrar la fecha de finalización
      if (status === "COMPLETED" && task.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      }

      // Si se cambia de completada a otro estado, quitar la fecha de finalización
      if (status !== "COMPLETED" && task.status === "COMPLETED") {
        updateData.completedAt = null;
      }

      // Actualizar la tarea
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });

      return NextResponse.json(updatedTask);
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
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la tarea" },
      { status: 500 }
    );
  }
}
