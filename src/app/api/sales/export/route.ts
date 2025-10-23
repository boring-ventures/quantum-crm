import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  formatQuotationsForExport,
  formatQuotationProductsForExport,
  formatReservationsForExport,
  formatReservationProductsForExport,
  formatSalesForExport,
  formatSaleProductsForExport,
  formatDate,
} from "@/lib/utils/sales-export-utils";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;

    // Get parameters
    const typesParam = searchParams.get("types") || "";
    const applyFilters = searchParams.get("applyFilters") === "true";
    const search = searchParams.get("search");
    const assignedToId = searchParams.get("assignedToId");
    const countryId = searchParams.get("countryId");
    const status = searchParams.get("status");
    const category = searchParams.get("category"); // businessTypeId
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Parse selected types
    const types = typesParam.split(",").filter(Boolean);
    if (types.length === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar al menos un tipo de operación" },
        { status: 400 }
      );
    }

    // Build where clause for filters (if applyFilters is true)
    const buildWhereClause = (): any => {
      if (!applyFilters) return {};

      const where: any = {};

      // Search filter (applies to lead name, email, phone)
      if (search) {
        where.lead = {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { cellphone: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      // Status filter
      if (status && status !== "all") {
        where.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Assigned to filter
      if (assignedToId) {
        where.lead = {
          ...where.lead,
          assignedToId: assignedToId,
        };
      }

      // Country filter (via assignedTo's country)
      if (countryId) {
        where.lead = {
          ...where.lead,
          assignedTo: {
            countryId: countryId,
          },
        };
      }

      return where;
    };

    // Prepare data arrays
    let quotations: any[] = [];
    let reservations: any[] = [];
    let sales: any[] = [];

    // Common include for all queries
    const leadInclude = {
      firstName: true,
      lastName: true,
      maternalLastName: true,
      email: true,
      phone: true,
      cellphone: true,
      nitCarnet: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          country: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    };

    // Fetch Quotations
    if (types.includes("quotations")) {
      const quotationsWhere = buildWhereClause();

      // Category filter for quotations (via quotationProducts)
      if (applyFilters && category && category !== "all") {
        quotationsWhere.quotationProducts = {
          some: {
            product: {
              businessTypeId: category,
            },
          },
        };
      }

      quotations = await prisma.quotation.findMany({
        where: quotationsWhere,
        include: {
          lead: {
            select: leadInclude,
          },
          quotationProducts: {
            include: {
              product: {
                include: {
                  brand: { select: { name: true } },
                  model: { select: { name: true } },
                  businessType: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Fetch Reservations
    if (types.includes("reservations")) {
      const reservationsWhere = buildWhereClause();

      // Category filter for reservations (via quotation products)
      if (applyFilters && category && category !== "all") {
        reservationsWhere.quotation = {
          quotationProducts: {
            some: {
              product: {
                businessTypeId: category,
              },
            },
          },
        };
      }

      reservations = await prisma.reservation.findMany({
        where: reservationsWhere,
        include: {
          lead: {
            select: leadInclude,
          },
          quotation: {
            include: {
              quotationProducts: {
                include: {
                  product: {
                    include: {
                      brand: { select: { name: true } },
                      model: { select: { name: true } },
                      businessType: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Fetch Sales
    if (types.includes("sales")) {
      const salesWhere = buildWhereClause();

      // Category filter for sales (via reservation -> quotation products)
      if (applyFilters && category && category !== "all") {
        salesWhere.reservation = {
          quotation: {
            quotationProducts: {
              some: {
                product: {
                  businessTypeId: category,
                },
              },
            },
          },
        };
      }

      sales = await prisma.sale.findMany({
        where: salesWhere,
        include: {
          lead: {
            select: leadInclude,
          },
          reservation: {
            include: {
              quotation: {
                include: {
                  quotationProducts: {
                    include: {
                      product: {
                        include: {
                          brand: { select: { name: true } },
                          model: { select: { name: true } },
                          businessType: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create Summary Sheet
    const summaryData: any[][] = [
      ["EXPORTACIÓN DE DATOS - VENTAS Y OPERACIONES"],
      [""],
      ["Información de la Exportación"],
      ["Fecha de Exportación:", formatDate(new Date())],
      ["Tipos Incluidos:", types.join(", ").toUpperCase()],
      ["Filtros Aplicados:", applyFilters ? "Sí" : "No"],
      [""],
    ];

    // Add filter details if applied
    if (applyFilters) {
      summaryData.push(["Detalles de Filtros:"]);
      if (search) summaryData.push(["Búsqueda:", search]);
      if (status && status !== "all") summaryData.push(["Estado:", status]);
      if (category && category !== "all")
        summaryData.push(["Categoría:", category]);
      if (startDate) summaryData.push(["Fecha Inicio:", startDate]);
      if (endDate) summaryData.push(["Fecha Fin:", endDate]);
      if (assignedToId) summaryData.push(["Vendedor ID:", assignedToId]);
      if (countryId) summaryData.push(["País ID:", countryId]);
      summaryData.push([""]);
    }

    // Add record counts
    summaryData.push(["Resumen de Registros:"]);
    if (types.includes("quotations"))
      summaryData.push(["Cotizaciones:", quotations.length]);
    if (types.includes("reservations"))
      summaryData.push(["Reservas:", reservations.length]);
    if (types.includes("sales")) summaryData.push(["Ventas:", sales.length]);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "📊 Resumen");

    // Add Quotations sheets
    if (types.includes("quotations") && quotations.length > 0) {
      const quotationsData = formatQuotationsForExport(quotations);
      const quotationsSheet = XLSX.utils.json_to_sheet(quotationsData);

      // Auto-size columns
      const quotationsCols = Object.keys(quotationsData[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...quotationsData.map((row) =>
            String(row[key as keyof typeof row] || "").length
          )
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
      });
      quotationsSheet["!cols"] = quotationsCols;

      XLSX.utils.book_append_sheet(workbook, quotationsSheet, "Cotizaciones");

      // Add quotation products sheet
      const quotationProducts = formatQuotationProductsForExport(quotations);
      if (quotationProducts.length > 0) {
        const productsSheet = XLSX.utils.json_to_sheet(quotationProducts);
        const productsCols = Object.keys(quotationProducts[0] || {}).map(
          (key) => {
            const maxLen = Math.max(
              key.length,
              ...quotationProducts.map((row) =>
                String(row[key as keyof typeof row] || "").length
              )
            );
            return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
          }
        );
        productsSheet["!cols"] = productsCols;
        XLSX.utils.book_append_sheet(
          workbook,
          productsSheet,
          "Productos Cotizaciones"
        );
      }
    }

    // Add Reservations sheets
    if (types.includes("reservations") && reservations.length > 0) {
      const reservationsData = formatReservationsForExport(reservations);
      const reservationsSheet = XLSX.utils.json_to_sheet(reservationsData);

      // Auto-size columns
      const reservationsCols = Object.keys(reservationsData[0] || {}).map(
        (key) => {
          const maxLen = Math.max(
            key.length,
            ...reservationsData.map((row) =>
              String(row[key as keyof typeof row] || "").length
            )
          );
          return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
        }
      );
      reservationsSheet["!cols"] = reservationsCols;

      XLSX.utils.book_append_sheet(workbook, reservationsSheet, "Reservas");

      // Add reservation products sheet
      const reservationProducts =
        formatReservationProductsForExport(reservations);
      if (reservationProducts.length > 0) {
        const productsSheet = XLSX.utils.json_to_sheet(reservationProducts);
        const productsCols = Object.keys(reservationProducts[0] || {}).map(
          (key) => {
            const maxLen = Math.max(
              key.length,
              ...reservationProducts.map((row) =>
                String(row[key as keyof typeof row] || "").length
              )
            );
            return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
          }
        );
        productsSheet["!cols"] = productsCols;
        XLSX.utils.book_append_sheet(
          workbook,
          productsSheet,
          "Productos Reservas"
        );
      }
    }

    // Add Sales sheets
    if (types.includes("sales") && sales.length > 0) {
      const salesData = formatSalesForExport(sales);
      const salesSheet = XLSX.utils.json_to_sheet(salesData);

      // Auto-size columns
      const salesCols = Object.keys(salesData[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...salesData.map((row) =>
            String(row[key as keyof typeof row] || "").length
          )
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
      });
      salesSheet["!cols"] = salesCols;

      XLSX.utils.book_append_sheet(workbook, salesSheet, "Ventas");

      // Add sale products sheet
      const saleProducts = formatSaleProductsForExport(sales);
      if (saleProducts.length > 0) {
        const productsSheet = XLSX.utils.json_to_sheet(saleProducts);
        const productsCols = Object.keys(saleProducts[0] || {}).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...saleProducts.map((row) =>
              String(row[key as keyof typeof row] || "").length
            )
          );
          return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
        });
        productsSheet["!cols"] = productsCols;
        XLSX.utils.book_append_sheet(
          workbook,
          productsSheet,
          "Productos Ventas"
        );
      }
    }

    // Write to buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const fileName = `sales_export_${timestamp}.xlsx`;

    // Return response with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting sales data:", error);
    return NextResponse.json(
      {
        error: "Error al exportar los datos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
