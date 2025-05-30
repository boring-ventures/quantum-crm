import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SalesProcessStatus } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
      });
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ error: "Usuario no encontrado" }),
        {
          status: 404,
        }
      );
    }

    // Verificar permisos
    if (!hasPermission(currentUser, "users", "delete")) {
      return new NextResponse(
        JSON.stringify({ error: "No tienes permiso para eliminar usuarios" }),
        {
          status: 403,
        }
      );
    }

    const userId = params.id;

    // Buscar leads asignados al usuario
    const leadsWithActiveSales = await prisma.lead.findMany({
      where: {
        assignedToId: userId,
        sales: {
          some: {
            status: {
              not: SalesProcessStatus.COMPLETED,
            },
          },
        },
      },
      include: {
        sales: {
          where: {
            status: {
              not: SalesProcessStatus.COMPLETED,
            },
          },
        },
      },
      take: 1, // Solo necesitamos saber si existe al menos uno
    });

    return new NextResponse(
      JSON.stringify({
        hasActiveLeads: leadsWithActiveSales.length > 0,
        leadsCount: leadsWithActiveSales.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verificando leads:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}
