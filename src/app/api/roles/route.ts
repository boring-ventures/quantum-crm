import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Esquema de validación para crear un rol
const createRoleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  permissions: z
    .record(z.any())
    .refine(
      (val) => val && typeof val === "object",
      "Los permisos deben ser un objeto válido"
    ),
  isActive: z.boolean().optional(),
});

// GET /api/roles - Obtener todos los roles
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: roles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los roles" },
      { status: 500 }
    );
  }
}

// POST /api/roles - Crear un nuevo rol
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const result = createRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.format() },
        { status: 400 }
      );
    }

    // Verificar que el nombre sea único
    const existingRole = await prisma.role.findUnique({
      where: { name: result.data.name },
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: "Ya existe un rol con este nombre" },
        { status: 400 }
      );
    }

    // Crear el rol
    const newRole = await prisma.role.create({
      data: result.data,
    });

    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el rol" },
      { status: 500 }
    );
  }
}
