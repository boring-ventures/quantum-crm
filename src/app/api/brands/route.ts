import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
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
    const isActive = searchParams.get("isActive");

    // Construir condiciones de búsqueda
    const where: any = {};
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const brands = await prisma.brand.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Error al obtener las marcas" },
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
      const validatedData = brandSchema.parse(body);

      // Verificar si ya existe una marca con el mismo nombre
      const existingBrand = await prisma.brand.findFirst({
        where: {
          name: validatedData.name,
        },
      });

      if (existingBrand) {
        return NextResponse.json(
          { error: "Ya existe una marca con este nombre" },
          { status: 400 }
        );
      }

      // Crear la marca
      const brand = await prisma.brand.create({
        data: validatedData,
      });

      return NextResponse.json(brand, { status: 201 });
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
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Error al crear la marca" },
      { status: 500 }
    );
  }
}
