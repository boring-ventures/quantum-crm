import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: quotationId } = params;
    if (!quotationId) {
      return NextResponse.json(
        { error: "ID de cotización no válido" },
        { status: 400 }
      );
    }

    // Buscar productos asociados a la cotización
    const products = await prisma.quotationProduct.findMany({
      where: { quotationId },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    // Formatear la respuesta
    const result = products.map((qp) => ({
      id: qp.product.id,
      name: qp.product.name,
      quantity: qp.quantity,
      price: qp.price,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener productos de la cotización:", error);
    return NextResponse.json(
      { error: "Error al obtener productos de la cotización" },
      { status: 500 }
    );
  }
}
