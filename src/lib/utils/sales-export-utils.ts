import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format payment method enum to Spanish label
 */
export function formatPaymentMethod(method: string): string {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta de crédito/débito";
    case "TRANSFER":
      return "Transferencia bancaria";
    case "CHECK":
      return "Cheque";
    case "FINANCING":
      return "Financiamiento";
    default:
      return method;
  }
}

/**
 * Format currency enum
 */
export function formatCurrency(currency: string | null | undefined): string {
  if (currency === "USD") return "USD";
  if (currency === "USDT") return "USDT";
  return "BOB";
}

/**
 * Format sale status
 */
export function formatSaleStatus(status: string): string {
  switch (status) {
    case "IN_PRODUCTION":
      return "En producción";
    case "IN_STORE":
      return "En tienda";
    case "INVOICED":
      return "Facturada";
    case "REFUND_REQUEST":
      return "Solicitud de devolución";
    default:
      return status;
  }
}

/**
 * Format approval status
 */
export function formatApprovalStatus(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    default:
      return status;
  }
}

/**
 * Format process status
 */
export function formatProcessStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

/**
 * Safe date formatter
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: es });
  } catch (error) {
    return "";
  }
}

/**
 * Format quotations data for export
 */
export function formatQuotationsForExport(quotations: any[]) {
  return quotations.map((quotation) => {
    const lead = quotation.lead || {};
    const assignedTo = lead.assignedTo || {};
    const country = assignedTo.country || {};

    return {
      ID: quotation.id,
      "Fecha de Creación": formatDate(quotation.createdAt),
      "Fecha de Actualización": formatDate(quotation.updatedAt),

      // Client Information
      "Nombre Cliente": lead.firstName || "",
      "Apellido Cliente": lead.lastName || "",
      "Apellido Materno": lead.maternalLastName || "",
      "Email Cliente": lead.email || "",
      "Teléfono Cliente": lead.phone || "",
      "Celular Cliente": lead.cellphone || "",
      "NIT/Carnet": lead.nitCarnet || "",

      // Quotation Details
      "Monto Total": quotation.totalAmount
        ? parseFloat(quotation.totalAmount)
        : 0,
      "Moneda": formatCurrency(quotation.currency),
      "Estado": formatProcessStatus(quotation.status),
      "URL Proforma": quotation.proformaUrl || "",
      "Notas Adicionales": quotation.additionalNotes || "",

      // Assignment Information
      "Asignado a": assignedTo.name || "",
      "Email Vendedor": assignedTo.email || "",
      "País": country.name || "",
      "Código País": country.code || "",
    };
  });
}

/**
 * Format quotation products for export
 */
export function formatQuotationProductsForExport(quotations: any[]) {
  const products: any[] = [];

  quotations.forEach((quotation) => {
    const lead = quotation.lead || {};
    const quotationProducts = quotation.quotationProducts || [];

    quotationProducts.forEach((qp: any) => {
      const product = qp.product || {};
      const brand = product.brand || {};
      const model = product.model || {};
      const businessType = product.businessType || {};

      products.push({
        "ID Cotización": quotation.id,
        "Cliente": `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
        "ID Producto": product.id || "",
        "Código Producto": product.code || "",
        "Nombre Producto": product.nameProduct || product.name || "",
        "Marca": brand.name || "",
        "Modelo": model.name || "",
        "Tipo de Negocio": businessType.name || "",
        "Cantidad": qp.quantity || 0,
        "Precio Unitario": qp.price ? parseFloat(qp.price) : 0,
        "Subtotal": qp.quantity && qp.price
          ? parseFloat(qp.quantity) * parseFloat(qp.price)
          : 0,
      });
    });
  });

  return products;
}

/**
 * Format reservations data for export
 */
export function formatReservationsForExport(reservations: any[]) {
  return reservations.map((reservation) => {
    const lead = reservation.lead || {};
    const assignedTo = lead.assignedTo || {};
    const country = assignedTo.country || {};
    const quotation = reservation.quotation || {};

    return {
      ID: reservation.id,
      "Fecha de Creación": formatDate(reservation.createdAt),
      "Fecha de Actualización": formatDate(reservation.updatedAt),

      // Client Information
      "Nombre Cliente": lead.firstName || "",
      "Apellido Cliente": lead.lastName || "",
      "Apellido Materno": lead.maternalLastName || "",
      "Email Cliente": lead.email || "",
      "Teléfono Cliente": lead.phone || "",
      "Celular Cliente": lead.cellphone || "",
      "NIT/Carnet": lead.nitCarnet || "",

      // Reservation Details
      "Monto": reservation.amount ? parseFloat(reservation.amount) : 0,
      "Moneda": formatCurrency(reservation.currency),
      "Método de Pago": formatPaymentMethod(reservation.paymentMethod),
      "Fecha de Entrega": formatDate(reservation.deliveryDate),
      "Estado": formatProcessStatus(reservation.status),
      "Detalles del Vehículo": reservation.vehicleDetails || "",
      "Notas Adicionales": reservation.additionalNotes || "",

      // Documents
      "URL Formulario Reserva": reservation.reservationFormUrl || "",
      "URL Comprobante Depósito": reservation.depositReceiptUrl || "",
      "URL Contrato Reserva": reservation.reservationContractUrl || "",

      // Related Quotation
      "ID Cotización": quotation.id || "",
      "Monto Cotización": quotation.totalAmount
        ? parseFloat(quotation.totalAmount)
        : 0,

      // Assignment Information
      "Asignado a": assignedTo.name || "",
      "Email Vendedor": assignedTo.email || "",
      "País": country.name || "",
      "Código País": country.code || "",
    };
  });
}

/**
 * Format reservation products for export
 */
export function formatReservationProductsForExport(reservations: any[]) {
  const products: any[] = [];

  reservations.forEach((reservation) => {
    const lead = reservation.lead || {};
    const quotation = reservation.quotation || {};
    const quotationProducts = quotation.quotationProducts || [];

    quotationProducts.forEach((qp: any) => {
      const product = qp.product || {};
      const brand = product.brand || {};
      const model = product.model || {};
      const businessType = product.businessType || {};

      products.push({
        "ID Reserva": reservation.id,
        "Cliente": `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
        "ID Producto": product.id || "",
        "Código Producto": product.code || "",
        "Nombre Producto": product.nameProduct || product.name || "",
        "Marca": brand.name || "",
        "Modelo": model.name || "",
        "Tipo de Negocio": businessType.name || "",
        "Cantidad": qp.quantity || 0,
        "Precio Unitario": qp.price ? parseFloat(qp.price) : 0,
        "Subtotal": qp.quantity && qp.price
          ? parseFloat(qp.quantity) * parseFloat(qp.price)
          : 0,
      });
    });
  });

  return products;
}

/**
 * Format sales data for export
 */
export function formatSalesForExport(sales: any[]) {
  return sales.map((sale) => {
    const lead = sale.lead || {};
    const assignedTo = lead.assignedTo || {};
    const country = assignedTo.country || {};
    const reservation = sale.reservation || {};
    const quotation = reservation.quotation || {};

    return {
      ID: sale.id,
      "Fecha de Creación": formatDate(sale.createdAt),
      "Fecha de Actualización": formatDate(sale.updatedAt),

      // Client Information
      "Nombre Cliente": lead.firstName || "",
      "Apellido Cliente": lead.lastName || "",
      "Apellido Materno": lead.maternalLastName || "",
      "Email Cliente": lead.email || "",
      "Teléfono Cliente": lead.phone || "",
      "Celular Cliente": lead.cellphone || "",
      "NIT/Carnet": lead.nitCarnet || "",

      // Sale Details
      "Monto": sale.amount ? parseFloat(sale.amount) : 0,
      "Moneda": formatCurrency(sale.currency),
      "Método de Pago": formatPaymentMethod(sale.paymentMethod),
      "Estado de Venta": formatSaleStatus(sale.saleStatus),
      "Estado de Aprobación": formatApprovalStatus(sale.approvalStatus),
      "Notas Adicionales": sale.additionalNotes || "",

      // Approval Information
      "Aprobada Por": sale.approvedBy || "",
      "Fecha de Aprobación": formatDate(sale.approvedAt),
      "Rechazada Por": sale.rejectedBy || "",
      "Fecha de Rechazo": formatDate(sale.rejectedAt),
      "Razón de Rechazo": sale.rejectionReason || "",

      // Documents
      "URL Contrato Venta": sale.saleContractUrl || "",
      "URL Factura": sale.invoiceUrl || "",
      "URL Comprobante Pago": sale.paymentReceiptUrl || "",

      // Related Records
      "ID Reserva": reservation.id || "",
      "Monto Reserva": reservation.amount ? parseFloat(reservation.amount) : 0,
      "ID Cotización": quotation.id || "",
      "Monto Cotización": quotation.totalAmount
        ? parseFloat(quotation.totalAmount)
        : 0,

      // Assignment Information
      "Asignado a": assignedTo.name || "",
      "Email Vendedor": assignedTo.email || "",
      "País": country.name || "",
      "Código País": country.code || "",
    };
  });
}

/**
 * Format sale products for export
 */
export function formatSaleProductsForExport(sales: any[]) {
  const products: any[] = [];

  sales.forEach((sale) => {
    const lead = sale.lead || {};
    const reservation = sale.reservation || {};
    const quotation = reservation.quotation || {};
    const quotationProducts = quotation.quotationProducts || [];

    quotationProducts.forEach((qp: any) => {
      const product = qp.product || {};
      const brand = product.brand || {};
      const model = product.model || {};
      const businessType = product.businessType || {};

      products.push({
        "ID Venta": sale.id,
        "Cliente": `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
        "ID Producto": product.id || "",
        "Código Producto": product.code || "",
        "Nombre Producto": product.nameProduct || product.name || "",
        "Marca": brand.name || "",
        "Modelo": model.name || "",
        "Tipo de Negocio": businessType.name || "",
        "Cantidad": qp.quantity || 0,
        "Precio Unitario": qp.price ? parseFloat(qp.price) : 0,
        "Subtotal": qp.quantity && qp.price
          ? parseFloat(qp.quantity) * parseFloat(qp.price)
          : 0,
      });
    });
  });

  return products;
}
