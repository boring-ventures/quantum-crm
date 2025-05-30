import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import {
  checkPermission,
  getScope,
  hasPermission,
} from "@/lib/utils/permissions";

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
    // Obtener usuario actual con sus permisos
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permiso de visualización de leads
    if (!hasPermission(currentUser, "leads", "view")) {
      return NextResponse.json(
        { error: "No tienes permiso para ver leads" },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const statusId = searchParams.get("status");
    const sourceId = searchParams.get("source");
    const assignedTo = searchParams.get("assignedTo");
    const assignedToId = searchParams.get("assignedToId");

    // Construir condiciones de búsqueda base
    const where: any = {};

    // Búsqueda por texto
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtros específicos
    if (statusId) where.statusId = statusId;
    if (sourceId) where.sourceId = sourceId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (assignedToId) where.assignedToId = assignedToId;

    // Aplicar restricciones basadas en el scope de permisos
    const viewScope = getScope(currentUser, "leads", "view");

    // Aplicar filtros basados en el scope
    if (viewScope === "self") {
      // Solo puede ver sus propios leads
      where.assignedToId = currentUser.id;
    } else if (viewScope === "team" && currentUser.countryId) {
      // Puede ver leads de usuarios de su mismo país
      where.assignedTo = {
        countryId: currentUser.countryId,
      };
    }
    // Si viewScope es "all", no aplicamos filtros adicionales

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
          assignedTo: {
            include: {
              country: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          tasks: true,
          quotations: true,
          reservations: true,
          sales: true,
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
    // Obtener usuario actual con sus permisos
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permiso de creación de leads
    if (!hasPermission(currentUser, "leads", "create")) {
      return NextResponse.json(
        { error: "No tienes permiso para crear leads" },
        { status: 403 }
      );
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

      // Verificar existencia de las relaciones
      const [user, status, source] = await Promise.all([
        prisma.user.findUnique({
          where: { id: validatedData.assignedToId },
          include: { country: true },
        }),
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

      // Verificar si el usuario tiene permiso según el scope
      const createScope = getScope(currentUser, "leads", "create");

      // Si el scope es "self", solo puede asignar leads a sí mismo
      if (
        createScope === "self" &&
        validatedData.assignedToId !== currentUser.id
      ) {
        return NextResponse.json(
          { error: "Solo puedes crear leads asignados a ti mismo" },
          { status: 403 }
        );
      }

      // Si el scope es "team", solo puede asignar leads a usuarios de su país
      if (
        createScope === "team" &&
        currentUser.countryId &&
        user.countryId &&
        user.countryId !== currentUser.countryId
      ) {
        return NextResponse.json(
          { error: "Solo puedes crear leads asignados a usuarios de tu país" },
          { status: 403 }
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
      { error: "Error al crear el lead", details: error },
      { status: 500 }
    );
  }
}
