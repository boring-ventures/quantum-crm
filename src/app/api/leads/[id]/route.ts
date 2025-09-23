import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para actualización de leads
const updateLeadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  maternalLastName: z.string().optional().nullable(),
  nitCarnet: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .or(z.string().email("Email inválido")),
  phone: z.string().optional().nullable(),
  cellphone: z.string().min(1, "El celular es requerido").optional().nullable(),
  statusId: z.string().uuid("ID de estado inválido").optional(),
  sourceId: z.string().uuid("ID de fuente inválido").optional(),
  assignedToId: z.string().uuid("ID de usuario inválido").optional().nullable(),
  extraComments: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
  isClosed: z.boolean().optional(),
  closedAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : val)),
  reasonClosed: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  qualityScore: z.number().optional().nullable(),
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
    // Obtener el ID del lead desde los parámetros de ruta
    const { id } = await params;

    // Verificar si es una verificación de scope del middleware
    const { searchParams } = new URL(req.url);
    const scopeCheck = searchParams.get("scopeCheck");

    if (scopeCheck === "true") {
      // Para scope check, NO requerimos sesión; solo verificamos existencia
      const leadExists = await prisma.lead.count({ where: { id } });
      if (leadExists === 0) {
        return NextResponse.json(
          { error: "Lead no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Verificar autenticación para la lectura normal del recurso
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el lead con sus relaciones
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        status: true,
        source: {
          include: {
            category: true,
          },
        },
        assignedTo: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
        tasks: true,
        quotations: true,
        reservations: true,
        sales: true,
        reassignments: {
          include: {
            fromUser: true,
            toUser: true,
            reassignedByUser: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log("[PUT] No autorizado");
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el ID del lead desde los parámetros de ruta (await)
    const { id } = await params;
    console.log(`[PUT] Actualizando lead con id: ${id}`);

    // Verificar si el lead existe
    if (!(await leadExists(id))) {
      console.log(`[PUT] Lead no encontrado: ${id}`);
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    let body;
    try {
      body = await req.json();
      console.log("[PUT] Body recibido:", body);
    } catch (jsonError) {
      console.error("[PUT] Error al parsear JSON:", jsonError);
      return NextResponse.json(
        { success: false, error: "JSON inválido" },
        { status: 400 }
      );
    }

    try {
      console.log("[PUT] Iniciando validación de datos...");
      const validatedData = updateLeadSchema.parse(body);
      console.log("[PUT] Datos validados exitosamente:", validatedData);

      // Actualizar el lead - asegurándonos de que los tipos sean compatibles con Prisma
      const data: Record<string, any> = {};

      // Normalizar campos string vacíos a null
      const normalizeEmptyStringToNull = (value: any) =>
        typeof value === "string" && value.trim() === "" ? null : value;

      console.log("[PUT] Construyendo objeto data para Prisma...");

      // Solo agregar los campos que están definidos en validatedData
      if (validatedData.firstName !== undefined)
        data.firstName = normalizeEmptyStringToNull(validatedData.firstName);
      if (validatedData.lastName !== undefined)
        data.lastName = normalizeEmptyStringToNull(validatedData.lastName);
      if (validatedData.maternalLastName !== undefined)
        data.maternalLastName = normalizeEmptyStringToNull(
          validatedData.maternalLastName
        );
      if (validatedData.nitCarnet !== undefined)
        data.nitCarnet = normalizeEmptyStringToNull(validatedData.nitCarnet);
      if (validatedData.email !== undefined)
        data.email = normalizeEmptyStringToNull(validatedData.email);
      if (validatedData.phone !== undefined)
        data.phone = normalizeEmptyStringToNull(validatedData.phone);
      if (validatedData.cellphone !== undefined)
        data.cellphone = normalizeEmptyStringToNull(validatedData.cellphone);
      if (validatedData.extraComments !== undefined)
        data.extraComments = normalizeEmptyStringToNull(
          validatedData.extraComments
        );
      if (validatedData.isArchived !== undefined)
        data.isArchived = validatedData.isArchived;
      if (validatedData.isClosed !== undefined)
        data.isClosed = validatedData.isClosed;
      if (validatedData.closedAt !== undefined)
        data.closedAt = validatedData.closedAt;
      if (validatedData.reasonClosed !== undefined)
        data.reasonClosed = normalizeEmptyStringToNull(
          validatedData.reasonClosed
        );
      if (validatedData.qualityScore !== undefined)
        data.qualityScore = validatedData.qualityScore;

      // Para relaciones, usar connect/disconnect syntax
      if (validatedData.statusId !== undefined) {
        const statusId = normalizeEmptyStringToNull(validatedData.statusId);
        if (statusId) {
          data.status = { connect: { id: statusId } };
        }
      }

      if (validatedData.sourceId !== undefined) {
        const sourceId = normalizeEmptyStringToNull(validatedData.sourceId);
        if (sourceId) {
          data.source = { connect: { id: sourceId } };
        }
      }

      if (validatedData.assignedToId !== undefined) {
        const assignedToId = normalizeEmptyStringToNull(
          validatedData.assignedToId
        );
        if (assignedToId) {
          data.assignedTo = { connect: { id: assignedToId } };
        }
      }

      if (validatedData.productId !== undefined) {
        const productId = normalizeEmptyStringToNull(validatedData.productId);
        if (productId) {
          data.product = { connect: { id: productId } };
        } else {
          data.product = { disconnect: true };
        }
      }

      console.log(
        "[PUT] Objeto data construido:",
        JSON.stringify(data, null, 2)
      );
      console.log("[PUT] Verificando que data no sea null:", data !== null);
      console.log("[PUT] Tipo de data:", typeof data);
      console.log("[PUT] Keys de data:", Object.keys(data));

      console.log("[PUT] Ejecutando prisma.lead.update...");
      const updatedLead = await prisma.lead.update({
        where: { id },
        data,
        include: {
          status: true,
          source: {
            include: {
              category: true,
            },
          },
          assignedTo: true,
        },
      });

      console.log("[PUT] Lead actualizado correctamente:", updatedLead);
      return NextResponse.json({ success: true, data: updatedLead });
    } catch (validationError) {
      console.log("[PUT] Entró en catch de validación");
      console.log("[PUT] Tipo de error:", typeof validationError);
      console.log(
        "[PUT] Error es instancia de ZodError:",
        validationError instanceof z.ZodError
      );
      console.log(
        "[PUT] Error es instancia de Error:",
        validationError instanceof Error
      );

      if (validationError instanceof z.ZodError) {
        console.error(
          "[PUT] Error de validación Zod:",
          validationError.format()
        );
        return NextResponse.json(
          {
            success: false,
            error: "Datos inválidos",
            details: validationError.format(),
          },
          { status: 400 }
        );
      }

      // Log más detallado del error
      console.error(
        "[PUT] Error inesperado de validación - Mensaje:",
        validationError instanceof Error
          ? validationError.message
          : "Sin mensaje"
      );
      console.error(
        "[PUT] Error inesperado de validación - Stack:",
        validationError instanceof Error ? validationError.stack : "Sin stack"
      );
      console.error(
        "[PUT] Error inesperado de validación - Completo:",
        validationError
      );

      return NextResponse.json(
        { success: false, error: "Error de validación desconocido" },
        { status: 400 }
      );
    }
  } catch (error) {
    // Siempre loguear el error y asegurar que el payload sea un objeto
    console.error(
      "[PUT] Error general al actualizar lead (final catch):",
      error || "Error desconocido"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el lead",
      },
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
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
