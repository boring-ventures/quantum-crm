import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Agregar método GET para evitar problemas de OPTIONS/preflight
export async function GET() {
  return NextResponse.json({ message: "Endpoint listo para reasignaciones" });
}

export async function POST(request: Request) {
  try {
    // Obtener datos del request
    const body = await request.json();
    const { leadIds, toUserId, reason, currentUserId } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length < 2) {
      return NextResponse.json(
        {
          message: "Se requieren al menos 2 leads para la reasignación masiva",
        },
        { status: 400 }
      );
    }

    if (!toUserId) {
      return NextResponse.json(
        { message: "Se requiere un usuario destino para la reasignación" },
        { status: 400 }
      );
    }

    if (!currentUserId) {
      return NextResponse.json(
        { message: "Se requiere el ID del usuario que realiza la acción" },
        { status: 400 }
      );
    }

    // Verificar que el usuario destino existe
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
    });

    if (!toUser) {
      return NextResponse.json(
        { message: "Usuario destino no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que los leads existen
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { message: "No se encontraron leads válidos para reasignar" },
        { status: 404 }
      );
    }

    // Reasignar leads
    const results = {
      success: 0,
      failed: 0,
      total: leads.length,
    };

    for (const leadId of leads.map((lead) => lead.id)) {
      try {
        // Obtener lead actual para obtener el usuario asignado actual
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { assignedToId: true },
        });

        if (!lead) {
          results.failed++;
          continue;
        }

        // Actualizar asignación del lead
        await prisma.lead.update({
          where: { id: leadId },
          data: { assignedToId: toUserId },
        });

        // Registrar la reasignación
        await prisma.leadReassignment.create({
          data: {
            leadId,
            fromUserId: lead.assignedToId,
            toUserId,
            reassignedBy: currentUserId,
            reason: reason || "Reasignación masiva",
          },
        });

        results.success++;
      } catch (error) {
        console.error(`Error al reasignar lead ${leadId}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error en batch-reassign:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
