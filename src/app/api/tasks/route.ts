import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para la creación de tareas
const createTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  leadId: z.string().uuid("ID de lead inválido"),
  assignedToId: z.string().min(1, "El ID del usuario asignado es requerido"),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .default("PENDING"),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const validatedData = createTaskSchema.parse(body);

      // Verificar que el lead existe
      const lead = await prisma.lead.findUnique({
        where: { id: validatedData.leadId },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead no encontrado" },
          { status: 404 }
        );
      }

      // Crear la tarea
      const task = await prisma.task.create({
        data: {
          title: validatedData.title,
          status: validatedData.status,
          leadId: validatedData.leadId,
          assignedToId: validatedData.assignedToId,
        },
      });

      return NextResponse.json(task, { status: 201 });
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
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Error al crear la tarea" },
      { status: 500 }
    );
  }
}
