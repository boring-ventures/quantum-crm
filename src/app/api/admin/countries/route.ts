import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hasPermission } from "@/lib/utils/permissions";
import { getCurrentUser } from "@/lib/utils/auth-utils";

// Esquema de validación para país
const countrySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(3)
    .toUpperCase(),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(currentUser, "countries", "view")) {
      return NextResponse.json(
        { error: "No tienes permisos para ver países" },
        { status: 403 }
      );
    }

    // Obtener todos los países con conteo de usuarios
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Error al obtener los países" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(currentUser, "countries", "create")) {
      return NextResponse.json(
        { error: "No tienes permisos para crear países" },
        { status: 403 }
      );
    }

    // Validar datos
    const body = await request.json();

    try {
      const validatedData = countrySchema.parse(body);

      // Verificar si ya existe un país con el mismo nombre o código
      const existingCountry = await prisma.country.findFirst({
        where: {
          OR: [{ name: validatedData.name }, { code: validatedData.code }],
        },
      });

      if (existingCountry) {
        if (existingCountry.name === validatedData.name) {
          return NextResponse.json(
            { error: "Ya existe un país con este nombre" },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "Ya existe un país con este código" },
            { status: 400 }
          );
        }
      }

      // Crear país
      const country = await prisma.country.create({
        data: validatedData,
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      // Registrar cambio en CHANGELOG-QUANTUM.txt
      // Esta parte debería implementarse según las instrucciones específicas del proyecto

      return NextResponse.json(country, { status: 201 });
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
    console.error("Error creating country:", error);
    return NextResponse.json(
      { error: "Error al crear el país" },
      { status: 500 }
    );
  }
}
