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
  UserIcon,
  Plus,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  useBusinessTypes,
} from "./hooks/use-sales-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/userStore";
import { hasPermission, getScope } from "@/lib/utils/permissions";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SalesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ventas" | "reservas">("ventas");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [hasSelectedSeller, setHasSelectedSeller] = useState(false);
  const [showSellerSelector, setShowSellerSelector] = useState(true);

  // Obtener el usuario actual y sus permisos
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useUserStore();

  // Verificar permisos específicos
  const canViewSales = hasPermission(currentUser, "sales", "view");
  const canCreateSales = hasPermission(currentUser, "sales", "create");
  const canEditSales = hasPermission(currentUser, "sales", "edit");
  const canDeleteSales = hasPermission(currentUser, "sales", "delete");
  const salesScope = getScope(currentUser, "sales", "view");

  // Determinar si es rol administrativo y el alcance
  const isManagerRole = salesScope === "all" || salesScope === "team";
  const isSeller = salesScope === "self";

  // Si el usuario es vendedor, mostrar solo sus propias ventas/reservas
  const assignedToId = !isManagerRole
    ? currentUser?.id
    : selectedSellerId || undefined;

  // Si el usuario es vendedor, ya podemos mostrar el contenido
  const shouldShowContent =
    isSeller ||
    hasSelectedSeller ||
    (isManagerRole && selectedSellerId !== null);

  // Consulta para obtener la lista de vendedores según el scope
  const { data: sellersData, isLoading: loadingSellers } = useQuery({
    queryKey: [
      "sellers",
      { countryId: currentUser?.countryId, scope: salesScope },
    ],
    queryFn: async () => {
      if (!isManagerRole) return { users: [] };

      // Construir la URL base
      let url = `/api/users?`;

      // Agregar filtros según el scope
      if (salesScope === "team" && currentUser?.countryId) {
        url += `countryId=${currentUser.countryId}&`;
      }

      // Agregar filtro de permisos
      url += `hasPermission=sales.view`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al obtener usuarios");
      }
      return response.json();
    },
    enabled: isManagerRole && !isLoadingCurrentUser,
  });

  // Obtener datos de ventas con los filtros apropiados
  const { data: sales, isLoading: salesLoading } = useSales({
    searchQuery: searchQuery || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    dateRange:
      dateRange?.from && dateRange?.to
        ? [dateRange.from, dateRange.to]
        : undefined,
    assignedToId,
    countryId: salesScope === "team" ? currentUser?.countryId : undefined,
  });

  // Obtener datos de reservas con los filtros apropiados
  const { data: reservations, isLoading: reservationsLoading } =
    useReservations({
      searchQuery: searchQuery || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      dateRange:
        dateRange?.from && dateRange?.to
          ? [dateRange.from, dateRange.to]
          : undefined,
      assignedToId,
      countryId: salesScope === "team" ? currentUser?.countryId : undefined,
    });

  // Usar useEffect para manejar el cambio de roles
  useEffect(() => {
    // Si es vendedor, mostrar el contenido automáticamente
    if (isSeller) {
      setHasSelectedSeller(true);
      setShowSellerSelector(false);
    }
  }, [isSeller]);

  const { data: categories, isLoading: categoriesLoading } =
    useProductCategories();
  const { data: statuses, isLoading: statusesLoading } = useSaleStatuses();
  const { data: businessTypes, isLoading: businessTypesLoading } =
    useBusinessTypes();

  // Manejar cambios en las pestañas
  const handleTabChange = (value: string) => {
    setActiveTab(value as "ventas" | "reservas");
  };

  // Manejar la selección de un vendedor
  const handleSelectSeller = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setHasSelectedSeller(true);
    // Ocultar selector después de seleccionar
    setShowSellerSelector(false);
  };

  // Manejar ver todas las ventas
  const handleViewAllSales = () => {
    setSelectedSellerId(null);
    setHasSelectedSeller(true);
    // Ocultar selector después de seleccionar "ver todas"
    setShowSellerSelector(false);
  };

  // Volver a la selección de vendedores
  const handleBackToSelection = () => {
    setShowSellerSelector(true);
    setHasSelectedSeller(false);
    setSelectedSellerId(null);
  };

  // Obtener nombre del vendedor seleccionado
  const getSelectedSellerName = () => {
    if (!selectedSellerId) return "Todos los vendedores";

    const sellers = sellersData?.users || [];
    const selectedSeller = sellers.find(
      (seller) => seller.id === selectedSellerId
    );
    return selectedSeller?.name || "Vendedor seleccionado";
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

  // Renderizar la tabla de vendedores si es administrador
  const renderSellersTable = () => {
    const sellers = sellersData?.users || [];

    if (loadingSellers) {
      return <div className="py-8 text-center">Cargando vendedores...</div>;
    }

    if (sellers.length === 0) {
      return (
        <div className="py-8 text-center">
          No hay vendedores disponibles. Agrega vendedores desde la sección de
          usuarios.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ventas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller: any) => (
            <TableRow key={seller.id}>
              <TableCell className="font-medium">{seller.name}</TableCell>
              <TableCell>{seller.email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {sales?.filter(
                    (sale) => sale.lead?.assignedTo?.id === seller.id
                  ).length || 0}{" "}
                  ventas
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectSeller(seller.id)}
                >
                  Ver ventas
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4}>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewAllSales}
              >
                Ver todas las ventas
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  // Renderizar tarjeta de venta
  const renderSaleCard = (sale: any) => {
    const productType = sale.lead?.product?.businessType?.name || "AUTOS";
    const clientName =
      `${sale.lead?.firstName || ""} ${sale.lead?.lastName || ""}`.trim();

    return (
      <Card key={sale.id} className="mb-4">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getProductIcon(productType)}</span>
            <div>
              <div className="flex items-center">
                <span className="text-muted-foreground text-sm uppercase font-medium mr-2">
                  {productType} -
                </span>
                <span className="font-semibold uppercase">{clientName}</span>
                <Badge
                  className="ml-3"
                  variant={
                    sale.status === "COMPLETED"
                      ? "default"
                      : sale.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"
                  }
                >
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
              <div className="text-sm text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
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
              <div className="text-xs text-muted-foreground">
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
      <Card key={reservation.id} className="mb-4">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getProductIcon(productType)}</span>
            <div>
              <div className="flex items-center">
                <span className="text-muted-foreground text-sm uppercase font-medium mr-2">
                  {productType} -
                </span>
                <span className="font-semibold uppercase">{clientName}</span>
                <Badge
                  className="ml-3"
                  variant={
                    reservation.status === "COMPLETED"
                      ? "default"
                      : reservation.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"
                  }
                >
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
              <div className="text-sm text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
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
              <div className="flex flex-col text-xs text-muted-foreground">
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
                  variant={daysRemaining >= 0 ? "default" : "destructive"}
                  className="mt-1 self-end"
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ventas y Reservas</h1>

        <div className="flex gap-2">
          {canCreateSales && (
            <>
              <Button size="sm" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Solo mostrar el selector de vendedor para roles administrativos */}
      {isManagerRole && showSellerSelector && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="mr-2 h-5 w-5" />
              <h2 className="text-xl font-semibold">Seleccione un vendedor</h2>
            </div>
            {renderSellersTable()}
          </CardContent>
        </Card>
      )}

      {/* Mostrar el contenido solo si debe mostrarse según la lógica definida */}
      {shouldShowContent && (
        <>
          {/* Mostrar información del vendedor seleccionado y botón "volver" para administradores */}
          {isManagerRole && !showSellerSelector && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="mr-2 h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Mostrando ventas de: {getSelectedSellerName()}
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                size="sm"
              >
                Volver a selección
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, producto..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: DateRange | undefined) =>
                      setDateRange(range)
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={categoryFilter || "all"}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de negocio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {businessTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter || "all"}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statuses?.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(dateRange ||
                categoryFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => {
                    setDateRange(undefined);
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="ventas"
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="ventas" className="space-y-4">
              {salesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : sales && sales.length > 0 ? (
                sales.map((sale) => renderSaleCard(sale))
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">
                    No hay ventas disponibles
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {isManagerRole && !selectedSellerId
                      ? "No se encontraron ventas para mostrar."
                      : "No se encontraron ventas con los criterios actuales."}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reservas" className="space-y-4">
              {reservationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : reservations && reservations.length > 0 ? (
                reservations.map((reservation) =>
                  renderReservationCard(reservation)
                )
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">
                    No hay reservas disponibles
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {isManagerRole && !selectedSellerId
                      ? "No se encontraron reservas para mostrar."
                      : "No se encontraron reservas con los criterios actuales."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {renderDetailSheet()}
    </div>
  );
}
