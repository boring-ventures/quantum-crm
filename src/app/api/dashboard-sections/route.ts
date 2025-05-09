import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Esquema de validación para crear una sección del dashboard
const createSectionSchema = z.object({
  key: z.string().min(1, "La clave es requerida"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  icon: z.string().optional(),
  url: z.string().min(1, "La URL es requerida"),
  parentKey: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/dashboard-sections - Obtener todas las secciones
export async function GET() {
  try {
    const sections = await prisma.dashboardSection.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      { success: true, data: sections },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard sections:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las secciones del dashboard" },
      { status: 500 }
    );
  }
}

// POST /api/dashboard-sections - Crear una nueva sección
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const result = createSectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.format() },
        { status: 400 }
      );
    }

    // Verificar que la clave sea única
    const existingSection = await prisma.dashboardSection.findUnique({
      where: { key: result.data.key },
    });

    if (existingSection) {
      return NextResponse.json(
        { success: false, error: "Ya existe una sección con esta clave" },
        { status: 400 }
      );
    }

    // Verificar parentKey si se proporciona
    if (result.data.parentKey) {
      const parentExists = await prisma.dashboardSection.findUnique({
        where: { key: result.data.parentKey },
      });

      if (!parentExists) {
        return NextResponse.json(
          { success: false, error: "La sección padre no existe" },
          { status: 400 }
        );
      }
    }

    // Crear la sección
    const newSection = await prisma.dashboardSection.create({
      data: result.data,
    });

    return NextResponse.json(
      { success: true, data: newSection },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating dashboard section:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la sección del dashboard" },
      { status: 500 }
    );
  }
}
