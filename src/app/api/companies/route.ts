import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  website: z.string().url("URL inválida").optional().nullable(),
  logo: z.string().optional().nullable(),
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
    const active = searchParams.get("active");

    // Construir condiciones de búsqueda
    const where: any = {};
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    const companies = await prisma.company.findMany({
      where,
      include: {
        brands: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Error al obtener las empresas" },
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
      const validatedData = companySchema.parse(body);

      // Verificar si ya existe una empresa con el mismo nombre
      const existingCompany = await prisma.company.findUnique({
        where: { name: validatedData.name },
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: "Ya existe una empresa con este nombre" },
          { status: 400 }
        );
      }

      // Crear la empresa
      const company = await prisma.company.create({
        data: validatedData,
      });

      return NextResponse.json(company, { status: 201 });
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
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Error al crear la empresa" },
      { status: 500 }
    );
  }
}
