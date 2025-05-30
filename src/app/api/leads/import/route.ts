import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import * as XLSX from "xlsx";

interface ImportRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | number;
  cellphone?: string | number;
  "status_name*"?: string;
  "source_name*"?: string;
  product_code?: string;
  extra_comments?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  received: any;
  expected: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userStr = formData.get("user") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!userStr) {
      return NextResponse.json(
        { error: "User data required" },
        { status: 400 }
      );
    }

    const user = JSON.parse(userStr);

    // Leer archivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON con header en primera fila
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) {
      return NextResponse.json(
        { error: "El archivo debe tener al menos una fila de datos" },
        { status: 400 }
      );
    }

    // Obtener headers y datos
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as any[][];

    // Validar headers requeridos
    const requiredHeaders = ["first_name", "last_name"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Headers faltantes: ${missingHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Obtener datos de referencia para mapeo
    const [statuses, sources, products, defaultStatus, defaultSource] =
      await Promise.all([
        prisma.leadStatus.findMany({ where: { isActive: true } }),
        prisma.leadSource.findMany({ where: { isActive: true } }),
        prisma.product.findMany({ where: { isActive: true } }),
        prisma.leadStatus.findFirst({ where: { name: "Nuevo Lead" } }),
        prisma.leadSource.findFirst({ where: { name: "Importación Excel" } }),
      ]);

    // Si no existe un estado/fuente por defecto, usar el primero disponible
    const fallbackStatusId = defaultStatus?.id || statuses[0]?.id;
    const fallbackSourceId = defaultSource?.id || sources[0]?.id;

    if (!fallbackStatusId || !fallbackSourceId) {
      return NextResponse.json(
        {
          error: "No hay estados o fuentes disponibles en el sistema",
        },
        { status: 400 }
      );
    }

    const successful: any[] = [];
    const errors: ValidationError[] = [];
    const createdCompanies: string[] = [];
    let realRowsCount = 0;

    // Procesar cada fila
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2; // +2 porque empezamos en fila 1 (header) + índice 0
      const row = dataRows[i];

      // Saltar filas completamente vacías o con solo espacios
      const isRowEmpty = row.every((cell) => {
        if (cell === undefined || cell === null) return true;
        if (typeof cell === "string" && cell.trim() === "") return true;
        return false;
      });
      if (isRowEmpty) continue;
      realRowsCount++;

      try {
        // Convertir fila a objeto
        const rowData: ImportRow = {};
        headers.forEach((header, index) => {
          rowData[header as keyof ImportRow] = row[index];
        });

        // Limpiar status_name y source_name de asteriscos y espacios
        if (rowData["status_name*"]) {
          rowData["status_name*"] = rowData["status_name*"]
            .toString()
            .replace(/\*/g, "")
            .trim();
        }
        if (rowData["source_name*"]) {
          rowData["source_name*"] = rowData["source_name*"]
            .toString()
            .replace(/\*/g, "")
            .trim();
        }

        // Validar y limpiar datos
        const cleanData = await validateAndCleanRow(rowData, rowIndex);

        if (cleanData.errors.length > 0) {
          errors.push(...cleanData.errors);
          continue;
        }

        // Mapear status
        let statusId = fallbackStatusId;
        if (cleanData.data["status_name*"]) {
          const status = statuses.find(
            (s) =>
              s.name.toLowerCase() ===
              cleanData.data["status_name*"]!.toLowerCase()
          );
          if (status) statusId = status.id;
        }

        // Mapear source
        let sourceId = fallbackSourceId;
        if (cleanData.data["source_name*"]) {
          const source = sources.find(
            (s) =>
              s.name.toLowerCase() ===
              cleanData.data["source_name*"]!.toLowerCase()
          );
          if (source) sourceId = source.id;
        }

        // Mapear product (opcional)
        let productId: string | null = null;
        if (cleanData.data.product_code) {
          const product = products.find(
            (p) =>
              p.code.toLowerCase() ===
              cleanData.data.product_code!.toLowerCase()
          );
          if (product) productId = product.id;
        }

        // Crear lead
        const lead = await prisma.lead.create({
          data: {
            firstName: cleanData.data.first_name!,
            lastName: cleanData.data.last_name!,
            email:
              cleanData.data.email && cleanData.data.email !== ""
                ? cleanData.data.email
                : null,
            phone:
              cleanData.data.phone && cleanData.data.phone !== ""
                ? cleanData.data.phone
                : null,
            cellphone:
              cleanData.data.cellphone && cleanData.data.cellphone !== ""
                ? cleanData.data.cellphone
                : null,
            extraComments:
              cleanData.data.extra_comments &&
              cleanData.data.extra_comments !== ""
                ? cleanData.data.extra_comments
                : null,
            statusId,
            sourceId,
            assignedToId: user.id,
            productId: productId !== "" ? productId : null,
            qualification: "NOT_QUALIFIED",
          },
        });

        successful.push({
          row: rowIndex,
          leadId: lead.id,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
        });
      } catch (error: any) {
        errors.push({
          row: rowIndex,
          field: "general",
          message: error.message || "Error procesando fila",
          received: row,
          expected: "valid data",
        });
      }
    }

    return NextResponse.json({
      total: realRowsCount,
      successful: successful.length,
      failed: errors.length,
      errors: errors.map((e) => ({
        row: e.row,
        error: `Campo: ${e.field}, ${e.message}`,
        data: e.received,
      })),
      created: successful,
      createdCompanies,
    });
  } catch (error: any) {
    console.error("Error en importación:", error);
    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// Función auxiliar para validar y limpiar datos de una fila
async function validateAndCleanRow(rowData: ImportRow, rowIndex: number) {
  const errors: ValidationError[] = [];
  const cleaned: any = {};

  // Validar first_name (requerido)
  if (!rowData.first_name || rowData.first_name.toString().trim() === "") {
    errors.push({
      row: rowIndex,
      field: "first_name",
      message: "Nombre es requerido",
      received: rowData.first_name,
      expected: "string",
    });
  } else {
    cleaned.first_name = rowData.first_name.toString().trim();
  }

  // Validar last_name (requerido)
  if (!rowData.last_name || rowData.last_name.toString().trim() === "") {
    errors.push({
      row: rowIndex,
      field: "last_name",
      message: "Apellido es requerido",
      received: rowData.last_name,
      expected: "string",
    });
  } else {
    cleaned.last_name = rowData.last_name.toString().trim();
  }

  // Validar email (opcional pero debe ser válido si se proporciona)
  if (rowData.email) {
    const emailStr = rowData.email.toString().trim();
    if (emailStr) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        errors.push({
          row: rowIndex,
          field: "email",
          message: "Email inválido",
          received: emailStr,
          expected: "valid email",
        });
      } else {
        // Verificar si el email ya existe
        const existingLead = await prisma.lead.findFirst({
          where: { email: emailStr },
        });
        if (existingLead) {
          errors.push({
            row: rowIndex,
            field: "email",
            message: "Email ya existe en el sistema",
            received: emailStr,
            expected: "unique email",
          });
        } else {
          cleaned.email = emailStr;
        }
      }
    }
  }

  // Limpiar teléfonos (convertir números a string)
  if (rowData.phone) {
    cleaned.phone = rowData.phone.toString().trim();
  }

  if (rowData.cellphone) {
    cleaned.cellphone = rowData.cellphone.toString().trim();
  }

  // Limpiar campos de texto
  if (rowData["status_name*"]) {
    cleaned["status_name*"] = rowData["status_name*"]
      .toString()
      .replace(/\*/g, "")
      .trim();
  }

  if (rowData["source_name*"]) {
    cleaned["source_name*"] = rowData["source_name*"]
      .toString()
      .replace(/\*/g, "")
      .trim();
  }

  if (rowData.product_code) {
    cleaned.product_code = rowData.product_code.toString().trim();
  }

  if (rowData.extra_comments) {
    cleaned.extra_comments = rowData.extra_comments.toString().trim();
  }

  return { data: cleaned, errors };
}

export async function GET(req: Request) {
  // Permitir validación de permisos (scopeCheck=true) desde el middleware
  return new Response(null, { status: 200 });
}
