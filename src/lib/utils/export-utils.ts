import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";

interface ExportData {
  sheetName: string;
  data: any[];
  headers: Record<string, string>;
  formatters?: Record<string, (value: any) => string>;
}

// Función segura para formatear fechas
function safeFormatDate(dateValue: any): string {
  if (!dateValue) return "";

  try {
    let date: Date;

    // Si ya es un objeto Date
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Si es un string, intentar parsearlo
    else if (typeof dateValue === "string") {
      // Intentar diferentes formatos de parsing
      date = parseISO(dateValue) || new Date(dateValue);
    }
    // Si es número (timestamp)
    else if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      return dateValue.toString();
    }

    // Validar que la fecha sea válida
    if (!isValid(date)) {
      console.warn("Invalid date value:", dateValue);
      return dateValue.toString();
    }

    return format(date, "dd/MM/yyyy", { locale: es });
  } catch (error) {
    console.warn("Error formatting date:", dateValue, error);
    return dateValue.toString();
  }
}

// Procesar datos con formatters seguros
function processData(
  data: any[],
  headers: Record<string, string>,
  formatters?: Record<string, (value: any) => string>
): any[][] {
  if (!data.length) return [];

  // Headers como primera fila
  const headerRow = Object.values(headers);

  // Datos procesados
  const dataRows = data.map((item) => {
    return Object.keys(headers).map((key) => {
      let value = item[key] ?? "";

      // Aplicar formateador si existe
      if (formatters && formatters[key]) {
        try {
          value = formatters[key](value);
        } catch (error) {
          console.warn(`Error formatting ${key}:`, value, error);
          value = value.toString();
        }
      }

      return value;
    });
  });

  return [headerRow, ...dataRows];
}

// Generar nombre de archivo con timestamp
function generateFilename(baseName: string): string {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss", { locale: es });
  return `${baseName}_${timestamp}.xlsx`;
}

// Descargar archivo Excel
function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  try {
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      compression: true,
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Error downloading Excel file:", error);
    throw new Error("Error al generar archivo Excel");
  }
}

// Obtener datos de Timeline
async function fetchTimelineData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.leadCategory && filters.leadCategory !== "all")
    params.append("leadCategory", filters.leadCategory);
  params.append("groupBy", "day");

  const response = await fetch(
    `/api/reports/leads-analytics/timeline?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching timeline data");

  return {
    sheetName: "Evolución Temporal",
    data: result.data.timeline,
    headers: {
      date: "Fecha",
      goodLeads: "Leads Buenos",
      badLeads: "Leads Malos",
      notQualified: "No Calificados",
      total: "Total",
    },
    formatters: {
      date: safeFormatDate,
    },
  };
}

// Obtener datos de Sources
async function fetchSourcesData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.leadCategory && filters.leadCategory !== "all")
    params.append("leadCategory", filters.leadCategory);

  const response = await fetch(
    `/api/reports/leads-analytics/sources?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching sources data");

  return {
    sheetName: "Distribución por Fuente",
    data: result.data.sources,
    headers: {
      name: "Fuente",
      category: "Categoría",
      count: "Cantidad Leads",
      percentage: "Porcentaje",
      costPerSource: "Costo por Fuente",
    },
    formatters: {
      percentage: (value: number) => `${value}%`,
      costPerSource: (value: number) =>
        value ? `$${value.toLocaleString("es-ES")}` : "N/A",
    },
  };
}

// Obtener datos de Countries
async function fetchCountriesData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.leadCategory && filters.leadCategory !== "all")
    params.append("leadCategory", filters.leadCategory);

  const response = await fetch(
    `/api/reports/leads-analytics/countries?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching countries data");

  return {
    sheetName: "Performance por País",
    data: result.data.countries,
    headers: {
      name: "País",
      code: "Código",
      totalLeads: "Total Leads",
      qualifiedLeads: "Leads Calificados",
      conversionRate: "Tasa Conversión",
      userCount: "Vendedores",
      avgLeadsPerUser: "Promedio por Vendedor",
    },
    formatters: {
      conversionRate: (value: number) => `${value}%`,
      avgLeadsPerUser: (value: string) => value,
    },
  };
}

// Obtener datos de Products
async function fetchProductsData(
  filters: any,
  groupBy: string = "product"
): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.sourceIds?.length)
    params.append("sourceIds", filters.sourceIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  if (filters.leadCategory && filters.leadCategory !== "all")
    params.append("leadCategory", filters.leadCategory);
  params.append("groupBy", groupBy);

  const response = await fetch(
    `/api/reports/leads-analytics/products?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching products data");

  const headers: Record<string, string> = {
    name:
      groupBy === "businessType"
        ? "Tipo de Negocio"
        : groupBy === "brand"
          ? "Marca"
          : "Producto",
    totalLeads: "Total Leads",
    qualifiedLeads: "Leads Calificados",
    conversionRate: "Tasa Conversión",
    avgPrice: "Precio Promedio",
  };

  // Agregar campos condicionales
  if (groupBy === "product") {
    headers.businessType = "Tipo de Negocio";
    headers.brand = "Marca";
  }

  return {
    sheetName: "Análisis por Producto",
    data: result.data.products,
    headers,
    formatters: {
      conversionRate: (value: number) => `${value}%`,
      avgPrice: (value: number) =>
        value ? `$${value.toLocaleString("es-ES")}` : "N/A",
    },
  };
}

// Función principal de exportación a Excel
export async function exportAllLeadsAnalytics(filters: any): Promise<void> {
  try {
    // Obtener todos los datos en paralelo
    const [timelineData, sourcesData, countriesData, productsData] =
      await Promise.all([
        fetchTimelineData(filters),
        fetchSourcesData(filters),
        fetchCountriesData(filters),
        fetchProductsData(filters, "product"),
      ]);

    // Crear workbook de Excel
    const workbook = XLSX.utils.book_new();

    // Procesar cada hoja
    const sheetsData = [timelineData, sourcesData, countriesData, productsData];

    sheetsData.forEach((sheetData) => {
      try {
        const processedData = processData(
          sheetData.data,
          sheetData.headers,
          sheetData.formatters
        );

        // Crear worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(processedData);

        // Configurar ancho de columnas automático
        const maxWidths = processedData[0].map((_, colIndex) => {
          return Math.max(
            ...processedData.map((row) =>
              row[colIndex] ? row[colIndex].toString().length : 0
            )
          );
        });

        worksheet["!cols"] = maxWidths.map((width) => ({
          wch: Math.min(Math.max(width + 2, 10), 50),
        }));

        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.sheetName);
      } catch (error) {
        console.error(`Error processing sheet ${sheetData.sheetName}:`, error);
        // Continuar con las otras hojas si una falla
      }
    });

    // Verificar que al menos una hoja se creó
    if (workbook.SheetNames.length === 0) {
      throw new Error("No se pudo generar ninguna hoja de datos");
    }

    // Agregar hoja de resumen
    const summaryData = [
      ["RESUMEN - DASHBOARD LEADS ANALYTICS"],
      [""],
      ["Filtros Aplicados:"],
      ["Fecha Inicio:", filters.startDate || "Sin filtro"],
      ["Fecha Fin:", filters.endDate || "Sin filtro"],
      [
        "Países:",
        filters.countryIds?.length
          ? `${filters.countryIds.length} seleccionados`
          : "Todos",
      ],
      [
        "Fuentes:",
        filters.sourceIds?.length
          ? `${filters.sourceIds.length} seleccionadas`
          : "Todas",
      ],
      [
        "Vendedores:",
        filters.assignedToIds?.length
          ? `${filters.assignedToIds.length} seleccionados`
          : "Todos",
      ],
      [""],
      ["Hojas incluidas:"],
      ...workbook.SheetNames.map((name) => [`- ${name}`]),
      [""],
      [
        "Generado el:",
        format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es }),
      ],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet["!cols"] = [{ wch: 25 }, { wch: 30 }];

    // Agregar hoja de resumen
    XLSX.utils.book_append_sheet(workbook, summarySheet, "📊 Resumen");

    // Reorganizar hojas para que el resumen sea primero
    const sheetNames = workbook.SheetNames;
    const summaryIndex = sheetNames.indexOf("📊 Resumen");
    if (summaryIndex > 0) {
      sheetNames.unshift(sheetNames.splice(summaryIndex, 1)[0]);
      workbook.SheetNames = sheetNames;
    }

    // Descargar archivo
    const filename = generateFilename("leads_analytics_completo");
    downloadExcel(workbook, filename);
  } catch (error) {
    console.error("Error exporting leads analytics:", error);
    throw new Error("Error al exportar el dashboard de Leads Analytics");
  }
}

// Funciones individuales para compatibilidad (deprecadas pero mantenidas)
export async function exportTimelineData(filters: any): Promise<void> {
  console.warn(
    "exportTimelineData is deprecated. Use exportAllLeadsAnalytics instead."
  );
  await exportAllLeadsAnalytics(filters);
}

export async function exportSourcesData(filters: any): Promise<void> {
  console.warn(
    "exportSourcesData is deprecated. Use exportAllLeadsAnalytics instead."
  );
  await exportAllLeadsAnalytics(filters);
}

export async function exportCountriesData(filters: any): Promise<void> {
  console.warn(
    "exportCountriesData is deprecated. Use exportAllLeadsAnalytics instead."
  );
  await exportAllLeadsAnalytics(filters);
}

export async function exportProductsData(
  filters: any,
  groupBy: string = "product"
): Promise<void> {
  console.warn(
    "exportProductsData is deprecated. Use exportAllLeadsAnalytics instead."
  );
  await exportAllLeadsAnalytics(filters);
}

// Sales Performance Export Functions

// Obtener datos de Sales Timeline
async function fetchSalesTimelineData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));
  params.append("groupBy", "day");

  const response = await fetch(
    `/api/reports/sales-performance/timeline?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching sales timeline data");

  return {
    sheetName: "Evolución Temporal",
    data: result.data.timeline,
    headers: {
      date: "Fecha",
      revenue: "Ingresos",
      sales: "# Ventas",
    },
    formatters: {
      date: safeFormatDate,
      revenue: (value: number) => `$${value.toLocaleString("es-ES")}`,
    },
  };
}

// Obtener datos de Sales Products
async function fetchSalesProductsData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));

  const response = await fetch(
    `/api/reports/sales-performance/products?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching sales products data");

  return {
    sheetName: "Productos",
    data: result.data.products,
    headers: {
      name: "Producto",
      revenue: "Ingresos",
      salesCount: "# Ventas",
      avgPrice: "Precio Promedio",
    },
    formatters: {
      revenue: (value: number) => `$${value.toLocaleString("es-ES")}`,
      avgPrice: (value: number) =>
        value ? `$${value.toLocaleString("es-ES")}` : "N/A",
    },
  };
}

// Obtener datos de Sales Payment Methods
async function fetchSalesMethodsData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));

  const response = await fetch(
    `/api/reports/sales-performance/methods?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching sales methods data");

  return {
    sheetName: "Métodos de Pago",
    data: result.data.methods,
    headers: {
      paymentMethodLabel: "Método de Pago",
      revenue: "Ingresos",
      salesCount: "# Ventas",
      percentage: "Porcentaje",
    },
    formatters: {
      revenue: (value: number) => `$${value.toLocaleString("es-ES")}`,
      percentage: (value: number) => `${value}%`,
    },
  };
}

// Obtener datos de Sales Countries
async function fetchSalesCountriesData(filters: any): Promise<ExportData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.countryIds?.length)
    params.append("countryIds", filters.countryIds.join(","));
  if (filters.assignedToIds?.length)
    params.append("assignedToIds", filters.assignedToIds.join(","));

  const response = await fetch(
    `/api/reports/sales-performance/countries?${params}`
  );
  const result = await response.json();

  if (!result.success) throw new Error("Error fetching sales countries data");

  return {
    sheetName: "Países",
    data: result.data.countries,
    headers: {
      countryName: "País",
      countryCode: "Código",
      revenue: "Ingresos",
      salesCount: "# Ventas",
    },
    formatters: {
      revenue: (value: number) => `$${value.toLocaleString("es-ES")}`,
    },
  };
}

// Función principal de exportación Sales Performance
export async function exportAllSalesPerformance(filters: any) {
  try {
    // Prepare query parameters
    const params = new URLSearchParams();

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.countryIds?.length)
      params.append("countryIds", filters.countryIds.join(","));
    if (filters.assignedToIds?.length)
      params.append("assignedToIds", filters.assignedToIds.join(","));

    // Fetch all data concurrently
    const [
      overviewResponse,
      timelineResponse,
      productsResponse,
      methodsResponse,
      countriesResponse,
    ] = await Promise.all([
      fetch(`/api/reports/sales-performance/overview?${params}`),
      fetch(`/api/reports/sales-performance/timeline?${params}`),
      fetch(`/api/reports/sales-performance/products?${params}`),
      fetch(`/api/reports/sales-performance/methods?${params}`),
      fetch(`/api/reports/sales-performance/countries?${params}`),
    ]);

    // Parse responses
    const overviewData = await overviewResponse.json();
    const timelineData = await timelineResponse.json();
    const productsData = await productsResponse.json();
    const methodsData = await methodsResponse.json();
    const countriesData = await countriesResponse.json();

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // 1. Overview/Summary Sheet
    const overviewSheet = [
      ["Sales Performance Summary", "", "", ""],
      [
        "Período",
        filters.startDate || "Sin definir",
        "hasta",
        filters.endDate || "Sin definir",
      ],
      ["", "", "", ""],
      ["Resumen General", "", "", ""],
      ["Total Ingresos", overviewData.data.overview.totalRevenue || 0, "", ""],
      [
        "Total Cotizaciones",
        overviewData.data.overview.totalQuotations || 0,
        "",
        "",
      ],
      [
        "Total Reservas",
        overviewData.data.overview.totalReservations || 0,
        "",
        "",
      ],
      ["Total Ventas", overviewData.data.overview.totalSales || 0, "", ""],
      [
        "Total Procesos",
        overviewData.data.overview.totalProcesses || 0,
        "",
        "",
      ],
      ["Ticket Promedio", overviewData.data.overview.avgTicket || 0, "", ""],
      [
        "Tasa de Conversión",
        `${overviewData.data.overview.conversionRate || 0}%`,
        "",
        "",
      ],
      [
        "Leads Convertidos",
        overviewData.data.overview.convertedLeads || 0,
        "",
        "",
      ],
      ["", "", "", ""],
      ["Desglose por Moneda", "", "", ""],
      ["Moneda", "Cotizaciones", "Reservas", "Ventas"],
    ];

    // Add currency breakdown
    Object.entries(overviewData.data.byCurrency || {}).forEach(
      ([currency, data]: [string, any]) => {
        overviewSheet.push([
          currency,
          `${data.quotations.count} ($${data.quotations.amount.toLocaleString()})`,
          `${data.reservations.count} ($${data.reservations.amount.toLocaleString()})`,
          `${data.sales.count} ($${data.sales.amount.toLocaleString()})`,
        ]);
      }
    );

    const overviewWs = XLSX.utils.aoa_to_sheet(overviewSheet);
    XLSX.utils.book_append_sheet(workbook, overviewWs, "Resumen");

    // 2. Timeline Sheet
    const timelineSheet = [
      ["Timeline - Ingresos y Procesos por Fecha", "", "", "", "", "", ""],
      [
        "Fecha",
        "Cotizaciones Count",
        "Cotizaciones Amount",
        "Reservas Count",
        "Reservas Amount",
        "Ventas Count",
        "Ventas Amount",
      ],
    ];

    if (timelineData.data.timeline?.length) {
      timelineData.data.timeline.forEach((item: any) => {
        timelineSheet.push([
          item.date,
          item.quotations.count,
          item.quotations.amount,
          item.reservations.count,
          item.reservations.amount,
          item.sales.count,
          item.sales.amount,
        ]);
      });
    }

    const timelineWs = XLSX.utils.aoa_to_sheet(timelineSheet);
    XLSX.utils.book_append_sheet(workbook, timelineWs, "Timeline");

    // 3. Products Sheet
    const productsSheet = [
      ["Top Productos por Ingresos", "", "", "", "", "", "", ""],
      [
        "Producto",
        "Moneda",
        "Cotizaciones Count",
        "Cotizaciones Revenue",
        "Reservas Count",
        "Reservas Revenue",
        "Ventas Count",
        "Ventas Revenue",
      ],
    ];

    if (productsData.data.products?.length) {
      productsData.data.products.forEach((product: any) => {
        productsSheet.push([
          product.name,
          product.currency,
          product.quotations.count,
          product.quotations.revenue,
          product.reservations.count,
          product.reservations.revenue,
          product.sales.count,
          product.sales.revenue,
        ]);
      });
    }

    const productsWs = XLSX.utils.aoa_to_sheet(productsSheet);
    XLSX.utils.book_append_sheet(workbook, productsWs, "Productos");

    // 4. Payment Methods Sheet
    const methodsSheet = [
      ["Métodos de Pago", "", "", "", "", ""],
      [
        "Método",
        "Moneda",
        "Total Count",
        "Total Revenue",
        "Reservas Count",
        "Ventas Count",
      ],
    ];

    if (methodsData.data.paymentMethods?.length) {
      methodsData.data.paymentMethods.forEach((method: any) => {
        methodsSheet.push([
          method.method,
          method.currency,
          method.count,
          method.revenue,
          method.reservations.count,
          method.sales.count,
        ]);
      });
    }

    const methodsWs = XLSX.utils.aoa_to_sheet(methodsSheet);
    XLSX.utils.book_append_sheet(workbook, methodsWs, "Métodos de Pago");

    // 5. Countries Sheet
    const countriesSheet = [
      ["Ventas por País", "", "", "", "", "", ""],
      [
        "País",
        "Código",
        "Cotizaciones Count",
        "Cotizaciones Revenue",
        "Reservas Count",
        "Reservas Revenue",
        "Ventas Count",
        "Ventas Revenue",
      ],
    ];

    if (countriesData.data.countries?.length) {
      countriesData.data.countries.forEach((country: any) => {
        countriesSheet.push([
          country.name,
          country.code,
          country.quotations?.count || 0,
          country.quotations?.revenue || 0,
          country.reservations?.count || 0,
          country.reservations?.revenue || 0,
          country.sales?.count || 0,
          country.sales?.revenue || 0,
        ]);
      });
    }

    const countriesWs = XLSX.utils.aoa_to_sheet(countriesSheet);
    XLSX.utils.book_append_sheet(workbook, countriesWs, "Países");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `sales-performance-${timestamp}.xlsx`;

    // Export file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Error exporting sales performance data:", error);
    throw new Error("Error al exportar los datos de performance de ventas");
  }
}
