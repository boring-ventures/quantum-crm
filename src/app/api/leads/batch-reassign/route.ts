import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { User } from "@/types/user";

export async function POST(request: Request) {
  try {
    // Verificar sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Obtener datos completos del usuario
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { userPermission: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Convertir el usuario de Prisma al tipo User esperado por las funciones de permisos
    const currentUser: User = {
      ...dbUser,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
      deletedAt: dbUser.deletedAt ? dbUser.deletedAt.toISOString() : null,
      userPermission: dbUser.userPermission
        ? {
            ...dbUser.userPermission,
            createdAt: dbUser.userPermission.createdAt.toISOString(),
            updatedAt: dbUser.userPermission.updatedAt.toISOString(),
          }
        : null,
    };

    // Verificar permisos
    if (!hasPermission(currentUser, "leads", "edit")) {
      return NextResponse.json(
        { message: "No tienes permisos para editar leads" },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const body = await request.json();
    const { leadIds, toUserId, reason } = body;

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

    // Obtener el scope de permiso para leads
    const leadsScope = getScope(currentUser, "leads", "edit");

    // Verificar que los leads existen y el usuario tiene permiso para editarlos
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { message: "No se encontraron leads válidos para reasignar" },
        { status: 404 }
      );
    }

    // Filtrar leads según permisos
    const authorizedLeadIds = leads
      .filter((lead) => {
        if (leadsScope === "all") return true;
        if (leadsScope === "team" && currentUser.countryId) {
          // Aquí necesitaríamos obtener el país del usuario asignado al lead
          // Simplificación: permitimos reasignar si el usuario actual es quien lo tiene asignado
          return lead.assignedToId === currentUser.id;
        }
        if (leadsScope === "self") {
          return lead.assignedToId === currentUser.id;
        }
        return false;
      })
      .map((lead) => lead.id);

    if (authorizedLeadIds.length === 0) {
      return NextResponse.json(
        { message: "No tienes permiso para reasignar ninguno de estos leads" },
        { status: 403 }
      );
    }

    // Reasignar leads
    const results = {
      success: 0,
      failed: 0,
      total: authorizedLeadIds.length,
    };

    for (const leadId of authorizedLeadIds) {
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
            reassignedBy: currentUser.id,
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
