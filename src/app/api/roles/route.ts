import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

// GET - Obtener todos los roles disponibles
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener todos los roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return NextResponse.json(
      { error: "Error al obtener roles" },
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
