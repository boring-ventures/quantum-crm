import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hasPermission } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { Prisma } from "@prisma/client";

// Esquema de validación para actualizar país
const updateCountrySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(3)
    .toUpperCase()
    .optional(),
});

// Método PUT para actualizar un país existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(currentUser, "countries", "edit")) {
      return NextResponse.json(
        { error: "No tienes permisos para editar países" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que el país existe
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) {
      return NextResponse.json(
        { error: "País no encontrado" },
        { status: 404 }
      );
    }

    // Validar datos
    const body = await request.json();

    try {
      const validatedData = updateCountrySchema.parse(body);

      // Si se actualiza el nombre o código, verificar que no existan duplicados
      if (validatedData.name || validatedData.code) {
        const whereConditions: Prisma.CountryWhereInput[] = [];

        if (validatedData.name) {
          whereConditions.push({
            name: validatedData.name,
            id: { not: id },
          });
        }

        if (validatedData.code) {
          whereConditions.push({
            code: validatedData.code,
            id: { not: id },
          });
        }

        const existingCountry = await prisma.country.findFirst({
          where: {
            OR: whereConditions,
          },
        });

        if (existingCountry) {
          if (
            validatedData.name &&
            existingCountry.name === validatedData.name
          ) {
            return NextResponse.json(
              { error: "Ya existe un país con este nombre" },
              { status: 400 }
            );
          } else if (
            validatedData.code &&
            existingCountry.code === validatedData.code
          ) {
            return NextResponse.json(
              { error: "Ya existe un país con este código" },
              { status: 400 }
            );
          }
        }
      }

      // Actualizar país
      const updatedCountry = await prisma.country.update({
        where: { id },
        data: validatedData,
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      return NextResponse.json(updatedCountry);
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
    console.error("Error updating country:", error);
    return NextResponse.json(
      { error: "Error al actualizar el país" },
      { status: 500 }
    );
  }
}

// Método DELETE para eliminar un país
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(currentUser, "countries", "delete")) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar países" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que el país existe
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!country) {
      return NextResponse.json(
        { error: "País no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el país tiene usuarios asociados
    if (country._count?.users > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un país con usuarios asociados",
          message:
            "Este país tiene usuarios asignados. Reasigna estos usuarios a otro país antes de eliminar.",
        },
        { status: 400 }
      );
    }

    // Eliminar país
    await prisma.country.delete({ where: { id } });

    return NextResponse.json(
      { message: "País eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting country:", error);
    return NextResponse.json(
      { error: "Error al eliminar el país" },
      { status: 500 }
    );
  }
}
