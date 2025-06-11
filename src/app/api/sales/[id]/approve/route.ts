import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { approvedBy } = await request.json();
    const saleId = params.id;

    // Verificar que la venta existe
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { lead: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la venta como aprobada
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        approvalStatus: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: { lead: true },
    });

    return NextResponse.json({
      success: true,
      data: updatedSale,
      leadId: sale.leadId,
    });
  } catch (error) {
    console.error("Error al aprobar venta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
