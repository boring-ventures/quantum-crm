import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Esquema de validación para actualizar un rol
const updateRoleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  permissions: z
    .record(z.any())
    .refine(
      (val) => val && typeof val === "object",
      "Los permisos deben ser un objeto válido"
    )
    .optional(),
  isActive: z.boolean().optional(),
});

// GET /api/roles/[id] - Obtener un rol específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role }, { status: 200 });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el rol" },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Actualizar un rol
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validar datos de entrada
    const result = updateRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.format() },
        { status: 400 }
      );
    }

    // Verificar que el rol existe
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el nombre sea único si se está actualizando
    if (result.data.name && result.data.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: result.data.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: "Ya existe un rol con este nombre" },
          { status: 400 }
        );
      }
    }

    // Actualizar el rol
    const updatedRole = await prisma.role.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(
      { success: true, data: updatedRole },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el rol" },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Eliminar un rol
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que el rol existe
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: "Rol no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay usuarios asignados a este rol
    if (existingRole.users.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar el rol porque hay usuarios asignados a él",
        },
        { status: 400 }
      );
    }

    // Eliminar el rol
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Rol eliminado con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el rol" },
      { status: 500 }
    );
  }
}
