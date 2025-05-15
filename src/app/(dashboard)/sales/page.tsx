"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Download,
  Printer,
  MoreVertical,
  Archive,
  ChevronDown,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  useSales,
  useReservations,
  useProductCategories,
  useSaleStatuses,
} from "./hooks/use-sales-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Card } from "@/components/ui/card";

export default function SalesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ventas" | "reservas">("ventas");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Obtener datos
  const { data: sales, isLoading: salesLoading } = useSales({
    searchQuery: searchQuery || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    dateRange:
      dateRange?.from && dateRange?.to
        ? [dateRange.from, dateRange.to]
        : undefined,
  });

  const { data: reservations, isLoading: reservationsLoading } =
    useReservations({
      searchQuery: searchQuery || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      dateRange:
        dateRange?.from && dateRange?.to
          ? [dateRange.from, dateRange.to]
          : undefined,
    });

  const { data: categories, isLoading: categoriesLoading } =
    useProductCategories();
  const { data: statuses, isLoading: statusesLoading } = useSaleStatuses();

  // Manejar cambios en las pestañas
  const handleTabChange = (value: string) => {
    setActiveTab(value as "ventas" | "reservas");
  };

  // Determinar ícono según tipo de producto
  const getProductIcon = (type?: string) => {
    if (!type) return "🚗";

    const typeLC = type.toLowerCase();
    if (typeLC.includes("moto")) return "🏍️";
    if (typeLC.includes("bici")) return "🚲";
    if (typeLC.includes("auto")) return "🚗";
    return "🚗";
  };

  // Calcular días restantes
  const getRemainingDays = (deliveryDate: string) => {
    const today = new Date();
    const delivery = parseISO(deliveryDate);
    return differenceInDays(delivery, today);
  };

  // Formatear método de pago
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "CASH":
        return "Efectivo";
      case "CARD":
        return "Tarjeta";
      case "TRANSFER":
        return "Transferencia";
      case "CHECK":
        return "Cheque";
      case "FINANCING":
        return "Financiamiento";
      default:
        return method;
    }
  };

  // Renderizar tarjeta de venta
  const renderSaleCard = (sale: any) => {
    const productType = sale.lead?.product?.businessType?.name || "AUTOS";
    const clientName =
      `${sale.lead?.firstName || ""} ${sale.lead?.lastName || ""}`.trim();

    return (
      <Card key={sale.id} className="p-5 mb-4 bg-gray-900 border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getProductIcon(productType)}</span>
            <div>
              <div className="flex items-center">
                <span className="text-gray-400 text-sm uppercase font-medium mr-2">
                  {productType} -
                </span>
                <span className="text-gray-200 font-semibold uppercase">
                  {clientName}
                </span>
                <Badge className="ml-3 bg-gray-800 text-gray-300 uppercase font-normal text-xs">
                  {sale.status === "COMPLETED"
                    ? "APROBADA"
                    : sale.status === "CANCELLED"
                      ? "CANCELADA"
                      : "ACTIVA"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mt-1">
                {sale.lead?.product?.name || "Producto no especificado"}
              </h3>
              <div className="text-sm text-gray-400 mt-1 flex items-center flex-wrap gap-1">
                <span>
                  #{sale.id.substring(0, 3)} | Cod. Int.{" "}
                  {sale.lead?.product?.code || "N/A"}
                </span>
                <span className="mx-1">•</span>
                <span>
                  {sale.lead?.assignedTo?.name || "Vendedor no asignado"}
                </span>
                <span className="mx-1">•</span>
                <span>Q - Cochabamba</span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="text-right mr-3">
              <div className="text-xs text-gray-400">
                {format(parseISO(sale.createdAt), "dd/MM/yyyy", { locale: es })}
              </div>
              <div className="text-xl font-bold">
                ${Number(sale.amount).toLocaleString()}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedItem(sale);
                    setIsDetailOpen(true);
                  }}
                >
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/leads/${sale.lead?.id}`}>
                    Ver perfil del cliente
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  };

  // Renderizar tarjeta de reserva
  const renderReservationCard = (reservation: any) => {
    const productType =
      reservation.lead?.product?.businessType?.name || "AUTOS";
    const clientName =
      `${reservation.lead?.firstName || ""} ${reservation.lead?.lastName || ""}`.trim();
    const daysRemaining = getRemainingDays(reservation.deliveryDate);

    return (
      <Card
        key={reservation.id}
        className="p-5 mb-4 bg-gray-900 border-gray-800"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getProductIcon(productType)}</span>
            <div>
              <div className="flex items-center">
                <span className="text-gray-400 text-sm uppercase font-medium mr-2">
                  {productType} -
                </span>
                <span className="text-gray-200 font-semibold uppercase">
                  {clientName}
                </span>
                <Badge className="ml-3 bg-gray-800 text-gray-300 uppercase font-normal text-xs">
                  {reservation.status === "COMPLETED"
                    ? "ACTIVA"
                    : reservation.status === "CANCELLED"
                      ? "CANCELADA"
                      : "BORRADOR"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mt-1">
                {reservation.lead?.product?.name || "PRODUCTO NO ESPECIFICADO"}
              </h3>
              <div className="text-sm text-gray-400 mt-1 flex items-center flex-wrap gap-1">
                <span>
                  #{reservation.id.substring(0, 3)} | Cod. Int.{" "}
                  {reservation.lead?.product?.code || "N/A"}
                </span>
                <span className="mx-1">•</span>
                <span>
                  {reservation.lead?.assignedTo?.name || "Vendedor no asignado"}
                </span>
                <span className="mx-1">•</span>
                <span>Q - Cochabamba</span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="text-right mr-3">
              <div className="flex flex-col text-xs text-gray-400">
                <span>
                  Reservado:{" "}
                  {format(parseISO(reservation.createdAt), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </span>
                <span>
                  Entrega:{" "}
                  {format(parseISO(reservation.deliveryDate), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </span>
                <Badge
                  className={`mt-1 self-end ${daysRemaining >= 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                >
                  {daysRemaining >= 0
                    ? `${daysRemaining} días restantes`
                    : `${Math.abs(daysRemaining)} días vencidos`}
                </Badge>
              </div>
              <div className="mt-1">
                <div className="text-xl font-bold">
                  ${Number(reservation.amount).toLocaleString()}
                </div>
                <div className="text-sm text-green-500">
                  Monto de reserva: $
                  {Number(reservation.amount).toLocaleString()}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedItem(reservation);
                    setIsDetailOpen(true);
                  }}
                >
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/leads/${reservation.lead?.id}`}>
                    Ver perfil del cliente
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  };

  // Renderizar detalle modal
  const renderDetailSheet = () => {
    if (!selectedItem) return null;

    const isSale = "saleContractUrl" in selectedItem;
    const item = selectedItem;
    const productType = item.lead?.product?.businessType?.name || "PRODUCTO";
    const clientName =
      `${item.lead?.firstName || ""} ${item.lead?.lastName || ""}`.trim();

    return (
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {isSale ? "Detalle de Venta" : "Detalle de Reserva"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">{productType}</h3>
              <h2 className="text-2xl font-bold mt-1">
                {item.lead?.product?.name || "Producto no especificado"}
              </h2>
              <div className="mt-2 text-sm text-gray-400">
                Código: {item.lead?.product?.code || "N/A"} | ID: #
                {item.id.substring(0, 8)}
              </div>
            </div>

            <div className="py-4 border-t border-b border-gray-800">
              <h3 className="font-medium mb-3">Información del Cliente</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Cliente:</span>
                  <span className="ml-2 font-medium">{clientName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Vendedor:</span>
                  <span className="ml-2">
                    {item.lead?.assignedTo?.name || "No asignado"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Oficina:</span>
                  <span className="ml-2">Cochabamba</span>
                </div>
              </div>
            </div>

            <div className="py-4 border-b border-gray-800">
              <h3 className="font-medium mb-3">
                Detalles de {isSale ? "Venta" : "Reserva"}
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Monto Total:</span>
                  <span className="ml-2 font-bold">
                    ${Number(item.amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Método de Pago:</span>
                  <span className="ml-2">
                    {formatPaymentMethod(item.paymentMethod)}
                  </span>
                </div>
                {!isSale && (
                  <div>
                    <span className="text-gray-400 text-sm">
                      Fecha de Entrega:
                    </span>
                    <span className="ml-2">
                      {format(parseISO(item.deliveryDate), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-sm">
                    Fecha de {isSale ? "Venta" : "Reserva"}:
                  </span>
                  <span className="ml-2">
                    {format(parseISO(item.createdAt), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Estado:</span>
                  <Badge className="ml-2">
                    {item.status === "COMPLETED"
                      ? "Completado"
                      : item.status === "CANCELLED"
                        ? "Cancelado"
                        : "Borrador"}
                  </Badge>
                </div>
              </div>
            </div>

            {item.additionalNotes && (
              <div>
                <h3 className="font-medium mb-2">Notas Adicionales</h3>
                <p className="text-sm text-gray-300">{item.additionalNotes}</p>
              </div>
            )}

            <div className="pt-4">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/leads/${item.lead?.id}`)}
              >
                Ver Perfil del Cliente
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-800 pb-2">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-fit">
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="ventas" className="mt-6">
            {salesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-[150px] w-full" />
                </div>
              ))
            ) : sales && sales.length > 0 ? (
              sales.map((sale) => renderSaleCard(sale))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">
                  No hay ventas registradas
                </h3>
                <p className="text-gray-500 mt-2">
                  No se encontraron ventas con los filtros actuales
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas" className="mt-6">
            {reservationsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-[150px] w-full" />
                </div>
              ))
            ) : reservations && reservations.length > 0 ? (
              reservations.map((reservation) =>
                renderReservationCard(reservation)
              )
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">
                  No hay reservas registradas
                </h3>
                <p className="text-gray-500 mt-2">
                  No se encontraron reservas con los filtros actuales
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {renderDetailSheet()}
    </div>
  );
}
