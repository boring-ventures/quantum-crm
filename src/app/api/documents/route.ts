import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createDocumentSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido"),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.string().min(1, "El tipo es requerido"),
  size: z.number().int().positive("El tamaño debe ser mayor a cero"),
  url: z.string().url("URL inválida"),
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
      const validatedData = createDocumentSchema.parse(body);

      // Crear el documento
      await prisma.$executeRaw`
        INSERT INTO documents (
          id, lead_id, name, type, size, url, created_at, updated_at
        ) VALUES (
          uuid_generate_v4(), 
          ${validatedData.leadId}, 
          ${validatedData.name}, 
          ${validatedData.type}, 
          ${validatedData.size}, 
          ${validatedData.url}, 
          NOW(), 
          NOW()
        )
        RETURNING *;
      `;

      // Consultar el documento recién creado
      const result = await prisma.$queryRaw`
        SELECT * FROM documents 
        WHERE lead_id = ${validatedData.leadId}
        ORDER BY created_at DESC 
        LIMIT 1;
      `;

      const documentData = Array.isArray(result) ? result[0] : result;

      // Responder con el documento creado
      return NextResponse.json(documentData, { status: 201 });
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
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Error al crear el documento" },
      { status: 500 }
    );
  }
}
