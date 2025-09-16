import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario no encontrado" },
        { status: 400 }
      );
    }

    // Obtener rol y permisos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRole: true,
        userPermission: true,
        country: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Determinar el scope de permisos para tareas
    let tasksScope = "self"; // Por defecto, solo sus propias tareas
    
    if (user.userPermission?.permissions) {
      const permissions = user.userPermission.permissions as any;
      if (permissions.tasks?.view?.scope) {
        tasksScope = permissions.tasks.view.scope;
      }
    } else if (user.userRole?.permissions) {
      const rolePermissions = user.userRole.permissions as any;
      if (rolePermissions.tasks?.view?.scope) {
        tasksScope = rolePermissions.tasks.view.scope;
      }
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search");
    const assignedToId = searchParams.get("assignedToId");
    const countryId = searchParams.get("countryId");
    const status = searchParams.get("status");
    const showAllTasks = searchParams.get("showAllTasks") === "true";
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Construir filtros WHERE
    const where: Prisma.TaskWhereInput = {};

    // Filtro de búsqueda por texto
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { completionNotes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Aplicar filtros según el scope y los parámetros
    if (tasksScope === "self" && !showAllTasks) {
      // Solo puede ver sus propias tareas
      where.assignedToId = userId;
    } else if (tasksScope === "team" && !showAllTasks) {
      // Puede ver tareas de su equipo (mismo país)
      if (assignedToId) {
        where.assignedToId = assignedToId;
      } else if (user.countryId) {
        where.assignedTo = {
          countryId: user.countryId,
        };
      }
    } else if (tasksScope === "all" || showAllTasks) {
      // Puede ver todas las tareas del sistema
      if (assignedToId) {
        where.assignedToId = assignedToId;
      } else if (countryId) {
        where.assignedTo = {
          countryId: countryId,
        };
      }
      // Si no hay filtros específicos, obtener todas las tareas
    }

    // Filtro por estado de tarea
    if (status) {
      where.status = status as any;
    }

    // Filtros por rango de fechas
    if (fromDate || toDate) {
      where.scheduledFor = {};
      if (fromDate) {
        where.scheduledFor.gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.scheduledFor.lte = endDate;
      }
    }

    // Obtener las tareas con todas las relaciones necesarias
    const tasks = await prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            cellphone: true,
            email: true,
            qualification: true,
            qualityScore: true,
            product: {
              select: {
                name: true,
                code: true,
              },
            },
            source: {
              select: {
                name: true,
              },
            },
            status: {
              select: {
                name: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { scheduledFor: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Formatear datos para el Excel
    const dataForSheet = tasks.map((task) => {
      const leadName = task.lead.firstName && task.lead.lastName
        ? `${task.lead.firstName} ${task.lead.lastName}`
        : task.lead.firstName || task.lead.lastName || `Sin nombre - ${task.lead.id.slice(-4)}`;

      // Calcular tiempo transcurrido para tareas completadas
      let timeToComplete = "N/A";
      if (task.completedAt && task.createdAt) {
        const diffMs = task.completedAt.getTime() - task.createdAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeToComplete = `${diffDays}d ${diffHours}h`;
      }

      // Determinar si la tarea está vencida
      let isOverdue = "No";
      if (task.status === "PENDING" && task.scheduledFor) {
        const now = new Date();
        if (new Date(task.scheduledFor) < now) {
          isOverdue = "Sí";
        }
      }

      return {
        "ID Tarea": task.id.substring(0, 8),
        "Título": task.title,
        "Comentario Inicial": task.description || "Sin comentario inicial",
        "Comentario Final": task.completionNotes || "Sin comentario de finalización",
        "Estado": translateTaskStatus(task.status),
        "Lead": leadName,
        "Celular Lead": task.lead.cellphone || "N/A",
        "Email Lead": task.lead.email || "N/A",
        "Producto": task.lead.product?.name || "N/A",
        "Código Producto": task.lead.product?.code || "N/A",
        "Fuente Lead": task.lead.source?.name || "N/A",
        "Estado Lead": task.lead.status?.name || "N/A",
        "Calificación Lead": translateLeadQualification(task.lead.qualification),
        "Puntuación Calidad": task.lead.qualityScore || "N/A",
        "Asignado a": task.assignedTo.name,
        "Email Asignado": task.assignedTo.email,
        "País": task.assignedTo.country?.name || "N/A",
        "Fecha Programada": task.scheduledFor 
          ? new Date(task.scheduledFor).toLocaleString('es-ES')
          : "N/A",
        "Tarea Vencida": isOverdue,
        "Fecha Creación": new Date(task.createdAt).toLocaleString('es-ES'),
        "Fecha Completado": task.completedAt 
          ? new Date(task.completedAt).toLocaleString('es-ES')
          : "N/A",
        "Tiempo para Completar": timeToComplete,
        "Última Actualización": new Date(task.updatedAt).toLocaleString('es-ES'),
      };
    });

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas");

    // Ajustar anchos de columna
    const columnWidths = Object.keys(dataForSheet[0] || {}).map((key) => {
      let width = key.length;
      if (dataForSheet.length > 0) {
        const max = Math.max(
          ...dataForSheet.map(
            (row) => String(row[key as keyof typeof row] || "").length
          )
        );
        width = Math.max(width, max);
      }
      return { wch: Math.min(width + 2, 50) }; // Máximo 50 caracteres de ancho
    });

    worksheet["!cols"] = columnWidths;

    // Agregar formato condicional para resaltar tareas vencidas
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const overdueCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 19 })]; // Columna "Tarea Vencida" (ajustado por las nuevas columnas)
      if (overdueCell && overdueCell.v === "Sí") {
        // Resaltar la fila completa si la tarea está vencida
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell) {
            cell.s = {
              fill: {
                fgColor: { rgb: "FFE6E6" } // Fondo rojo claro
              }
            };
          }
        }
      }
    }

    // Generar el archivo Excel
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generar nombre del archivo con fecha y hora
    const fileName = `quantum_crm_tareas_${new Date().toISOString().split("T")[0]}_${Date.now()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exportando tareas:", error);
    return NextResponse.json(
      { error: "Error al exportar las tareas" },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para traducir estados
function translateTaskStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En Progreso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };
  return translations[status] || status;
}

function translateLeadQualification(qualification: string | null): string {
  if (!qualification) return "N/A";
  const translations: Record<string, string> = {
    NOT_QUALIFIED: "No Calificado",
    GOOD_LEAD: "Buen Lead",
    BAD_LEAD: "Mal Lead",
  };
  return translations[qualification] || qualification;
}