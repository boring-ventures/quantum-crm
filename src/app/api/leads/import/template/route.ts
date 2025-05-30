import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    // Obtener datos para las listas de referencia
    const [statuses, sources, products] = await Promise.all([
      prisma.leadStatus.findMany({ where: { isActive: true } }),
      prisma.leadSource.findMany({ where: { isActive: true } }),
      prisma.product.findMany({ where: { isActive: true } }),
    ]);

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Crear hoja principal
    const headers = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "cellphone",
      "status_name",
      "source_name",
      "product_code",
      "extra_comments",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Configurar validaciones mediante comentarios
    const validStatusNames = statuses.map((s) => s.name).join(", ");
    const validSourceNames = sources.map((s) => s.name).join(", ");
    const validProductCodes = products.map((p) => p.code).join(", ");

    // Agregar comentarios con valores válidos
    worksheet["G1"] = {
      v: "status_name*",
      c: [{ a: "Valores válidos: " + validStatusNames }],
    };
    worksheet["H1"] = {
      v: "source_name*",
      c: [{ a: "Valores válidos: " + validSourceNames }],
    };
    worksheet["I1"] = {
      v: "product_code",
      c: [{ a: "Valores válidos: " + validProductCodes }],
    };

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Importar Leads");

    // Crear hoja de referencia
    const refData = [
      ["Estados Válidos", "Fuentes Válidas", "Códigos de Producto"],
      ...Array.from(
        { length: Math.max(statuses.length, sources.length, products.length) },
        (_, i) => [
          statuses[i]?.name || "",
          sources[i]?.name || "",
          products[i]?.code || "",
        ]
      ),
    ];

    const refWorksheet = XLSX.utils.aoa_to_sheet(refData);
    XLSX.utils.book_append_sheet(workbook, refWorksheet, "Referencias");

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="plantilla_leads.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error generando plantilla:", error);
    return NextResponse.json(
      { error: "Error generando la plantilla" },
      { status: 500 }
    );
  }
}
