import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const modelSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  brandId: z.string().uuid("ID de marca inválido"),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener filtros
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    // Construir condiciones de búsqueda
    const where: any = {};
    if (brandId) where.brandId = brandId;

    const models = await prisma.model.findMany({
      where,
      include: {
        brand: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Error al obtener los modelos" },
      { status: 500 }
    );
  }
}

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
      const validatedData = modelSchema.parse(body);

      // Verificar si existe la marca
      const brand = await prisma.brand.findUnique({
        where: { id: validatedData.brandId },
      });

      if (!brand) {
        return NextResponse.json(
          { error: "La marca especificada no existe" },
          { status: 400 }
        );
      }

      // Verificar si ya existe un modelo con el mismo nombre para esta marca
      const existingModel = await prisma.model.findFirst({
        where: {
          name: validatedData.name,
          brandId: validatedData.brandId,
        },
      });

      if (existingModel) {
        return NextResponse.json(
          { error: "Ya existe un modelo con este nombre para esta marca" },
          { status: 400 }
        );
      }

      // Crear el modelo
      const model = await prisma.model.create({
        data: validatedData,
        include: {
          brand: {
            include: {
              company: true,
            },
          },
        },
      });

      return NextResponse.json(model, { status: 201 });
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
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Error al crear el modelo" },
      { status: 500 }
    );
  }
}
