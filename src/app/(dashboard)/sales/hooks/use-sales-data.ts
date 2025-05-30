import { useQuery } from "@tanstack/react-query";
import { Sale } from "@/types/lead";
import { Reservation } from "@/types/lead";

interface SaleWithLead extends Sale {
  lead: {
    firstName: string;
    lastName: string;
    id: string;
    assignedTo?: {
      id: string;
      name: string;
    };
  };
  product?: {
    id: string;
    name: string;
    code: string;
    businessType?: {
      name: string;
    };
  };
}

interface ReservationWithLead extends Reservation {
  lead: {
    firstName: string;
    lastName: string;
    id: string;
    assignedTo?: {
      id: string;
      name: string;
    };
  };
  product?: {
    id: string;
    name: string;
    code: string;
    businessType?: {
      name: string;
    };
  };
}

// Obtener todas las ventas
export function useSales(filters?: {
  dateRange?: [Date, Date];
  category?: string;
  status?: string;
  searchQuery?: string;
  assignedToId?: string;
  countryId?: string;
}) {
  return useQuery<SaleWithLead[]>({
    queryKey: ["sales", filters],
    queryFn: async () => {
      // Construir parámetros de consulta basados en filtros
      const params = new URLSearchParams();

      if (filters?.dateRange) {
        params.append("startDate", filters.dateRange[0].toISOString());
        params.append("endDate", filters.dateRange[1].toISOString());
      }

      if (filters?.category && filters.category !== "all") {
        params.append("category", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        params.append("status", filters.status);
      }

      if (filters?.searchQuery) {
        params.append("search", filters.searchQuery);
      }

      // Agregar filtro por vendedor asignado
      if (filters?.assignedToId) {
        params.append("assignedToId", filters.assignedToId);
      }

      // Agregar filtro por país
      if (filters?.countryId) {
        params.append("countryId", filters.countryId);
      }

      const queryString = params.toString();
      const response = await fetch(
        `/api/sales/all${queryString ? `?${queryString}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener ventas");
      }

      return response.json();
    },
  });
}

// Obtener todas las reservas
export function useReservations(filters?: {
  dateRange?: [Date, Date];
  category?: string;
  status?: string;
  searchQuery?: string;
  assignedToId?: string;
  countryId?: string;
}) {
  return useQuery<ReservationWithLead[]>({
    queryKey: ["reservations", filters],
    queryFn: async () => {
      // Construir parámetros de consulta basados en filtros
      const params = new URLSearchParams();

      if (filters?.dateRange) {
        params.append("startDate", filters.dateRange[0].toISOString());
        params.append("endDate", filters.dateRange[1].toISOString());
      }

      if (filters?.category && filters.category !== "all") {
        params.append("category", filters.category);
      }

      if (filters?.status && filters.status !== "all") {
        params.append("status", filters.status);
      }

      if (filters?.searchQuery) {
        params.append("search", filters.searchQuery);
      }

      // Agregar filtro por vendedor asignado
      if (filters?.assignedToId) {
        params.append("assignedToId", filters.assignedToId);
      }

      // Agregar filtro por país
      if (filters?.countryId) {
        params.append("countryId", filters.countryId);
      }

      const queryString = params.toString();
      const response = await fetch(
        `/api/reservations/all${queryString ? `?${queryString}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener reservas");
      }

      return response.json();
    },
  });
}

// Obtener categorías de productos
export function useProductCategories() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const response = await fetch(`/api/products/categories`);

      if (!response.ok) {
        throw new Error("Error al obtener categorías de productos");
      }

      return response.json();
    },
  });
}

// Obtener estados disponibles para ventas/reservas
export function useSaleStatuses() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["saleStatuses"],
    queryFn: async () => {
      return [
        { id: "DRAFT", name: "Borrador" },
        { id: "COMPLETED", name: "Completada" },
        { id: "CANCELLED", name: "Cancelada" },
      ];
    },
  });
}

// Obtener tipos de negocios activos
export function useBusinessTypes() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["businessTypes"],
    queryFn: async () => {
      const response = await fetch(`/api/business-types?isActive=true`);

      if (!response.ok) {
        throw new Error("Error al obtener tipos de negocios");
      }

      return response.json();
    },
  });
}
