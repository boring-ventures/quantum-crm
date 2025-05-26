import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hasPermission } from "@/lib/utils/permissions";

const reassignSchema = z.object({
  newUserId: z.string().uuid("ID de usuario inválido"),
  performedBy: z.string().uuid("ID de usuario inválido"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const currentUser = session.user;
    const { id: leadId } = params;
    const body = await req.json();
    const { newUserId, performedBy } = reassignSchema.parse(body);

    // Validar permisos
    // Asegurar que currentUser.name, currentUser.email sean string y isActive boolean
    const safeUser = {
      ...currentUser,
      name: currentUser.name ?? "",
      email: currentUser.email ?? "",
      isActive: currentUser.isActive ?? true,
    };
    if (!hasPermission(safeUser, "leads", "update")) {
      return NextResponse.json(
        { error: "Sin permiso para reasignar leads" },
        { status: 403 }
      );
    }

    // Obtener el lead actual
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedTo: true },
    });
    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }
    if (lead.assignedToId === newUserId) {
      return NextResponse.json(
        { error: "El lead ya está asignado a este usuario" },
        { status: 400 }
      );
    }

    // Obtener usuarios involucrados
    const fromUser = await prisma.user.findUnique({
      where: { id: lead.assignedToId || undefined },
    });
    const toUser = await prisma.user.findUnique({ where: { id: newUserId } });
    const performedByUser = await prisma.user.findUnique({
      where: { id: performedBy },
    });
    if (!toUser || !performedByUser) {
      return NextResponse.json(
        { error: "Usuario destino o ejecutor no encontrado" },
        { status: 400 }
      );
    }

    // Actualizar el lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { assignedToId: newUserId },
      include: { assignedTo: true },
    });

    // Registrar la reasignación
    const reassignment = await prisma.leadReassignment.create({
      data: {
        leadId,
        fromUserId: fromUser?.id || performedBy, // Si no tenía asignado, usar el ejecutor
        toUserId: newUserId,
        reassignedBy: performedBy,
      },
      include: {
        fromUser: true,
        toUser: true,
        reassignedByUser: true,
      },
    });

    return NextResponse.json({ lead: updatedLead, reassignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.format() },
        { status: 400 }
      );
    }
    console.error("Error en reasignación de lead:", error);
    return NextResponse.json(
      { error: "Error al reasignar el lead" },
      { status: 500 }
    );
  }
}
