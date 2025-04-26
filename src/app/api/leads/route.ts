import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validación para la creación de leads
const createLeadSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  cellphone: z.string().optional().nullable(),
  companyId: z.string().uuid("ID de empresa inválido").optional().nullable(),
  statusId: z.string().uuid("ID de estado inválido"),
  sourceId: z.string().uuid("ID de fuente inválida"),
  qualityScore: z.number().min(1).max(3, "El puntaje debe estar entre 1 y 3"),
  productId: z.string().uuid("ID de producto inválido").optional().nullable(),
  assignedToId: z.string().uuid("ID de usuario inválido"),
  isArchived: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const statusId = searchParams.get("status");
    const sourceId = searchParams.get("source");
    const assignedToId = searchParams.get("assignedTo");

    // Construir condiciones de búsqueda
    const where: any = {};

    // Búsqueda por texto
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtros específicos
    if (statusId) where.statusId = statusId;
    if (sourceId) where.sourceId = sourceId;
    if (assignedToId) where.assignedToId = assignedToId;

    // Consultar leads con paginación
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          status: true,
          source: true,
          assignedTo: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    // Transformar los datos para que coincidan con la interfaz LeadWithRelations
    const formattedLeads = leads.map((lead: any) => ({
      ...lead,
      tags: lead.tags.map((lt: any) => lt.tag),
    }));

    // Calcular total de páginas
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      items: formattedLeads,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Error al obtener los leads" },
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
      const validatedData = createLeadSchema.parse(body);

      // Verificar si el email ya existe (si se proporciona)
      if (validatedData.email) {
        const existingLead = await prisma.lead.findUnique({
          where: { email: validatedData.email },
        });

        if (existingLead) {
          return NextResponse.json(
            {
              error: "El email ya existe",
              message: "Ya existe un lead con este email.",
            },
            { status: 400 }
          );
        }
      }

      console.log("Datos validados:", validatedData);

      // Verificar existencia de las relaciones
      const [user, status, source] = await Promise.all([
        prisma.user.findUnique({ where: { id: validatedData.assignedToId } }),
        prisma.leadStatus.findUnique({ where: { id: validatedData.statusId } }),
        prisma.leadSource.findUnique({ where: { id: validatedData.sourceId } }),
      ]);

      if (!user) {
        return NextResponse.json(
          {
            error: "Usuario asignado no encontrado",
            details: `No existe un usuario con ID ${validatedData.assignedToId}`,
          },
          { status: 400 }
        );
      }

      if (!status) {
        return NextResponse.json(
          {
            error: "Estado no encontrado",
            details: `No existe un estado con ID ${validatedData.statusId}`,
          },
          { status: 400 }
        );
      }

      if (!source) {
        return NextResponse.json(
          {
            error: "Fuente no encontrada",
            details: `No existe una fuente con ID ${validatedData.sourceId}`,
          },
          { status: 400 }
        );
      }

      // Crear el lead
      try {
        console.log("Intentando crear lead en Prisma...");
        const lead = await prisma.lead.create({
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            cellphone: validatedData.cellphone,
            companyId: validatedData.companyId,
            statusId: validatedData.statusId,
            sourceId: validatedData.sourceId,
            qualityScore: validatedData.qualityScore,
            productId: validatedData.productId,
            assignedToId: validatedData.assignedToId,
            isArchived: validatedData.isArchived || false,
          },
          include: {
            status: true,
            source: true,
            assignedTo: true,
          },
        });

        console.log("Lead creado exitosamente:", lead.id);
        return NextResponse.json(lead, { status: 201 });
      } catch (error) {
        return NextResponse.json(
          {
            error: "Error al crear el lead en la base de datos",
            details: error,
            code: "UNKNOWN_ERROR",
          },
          { status: 500 }
        );
      }
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
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Error al crear el lead" },
      { status: 500 }
    );
  }
}
