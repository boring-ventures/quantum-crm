import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  code: string;
  name: string;
  nameProduct: string;
  descriptionProduct?: string;
  price?: number;
  isActive: boolean;
  businessTypeId?: string;
  brandId?: string;
  modelId?: string;
  businessType?: { name: string };
  brand?: { name: string; company: { name: string } };
  model?: { name: string };
  images?: Array<{ url: string; isMain: boolean }>;
}

// Hook para obtener productos
export function useProducts(
  filters: {
    businessTypeId?: string;
    brandId?: string;
    modelId?: string;
    active?: boolean;
  } = {}
) {
  const { businessTypeId, brandId, modelId, active } = filters;

  // Construir parámetros de consulta
  const queryParams = new URLSearchParams();
  if (businessTypeId) queryParams.append("businessTypeId", businessTypeId);
  if (brandId) queryParams.append("brandId", brandId);
  if (modelId) queryParams.append("modelId", modelId);
  if (active !== undefined) queryParams.append("active", active.toString());
  // No agregar parámetro limit para obtener todos los productos

  return useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Error al obtener productos");
      }
      const data = await response.json();
      // Si la respuesta tiene .data, retorna eso, si no, retorna el array directamente
      return Array.isArray(data) ? data : (data.data ?? []);
    },
  });
}

// Hook para obtener un producto específico
export function useProduct(id?: string) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error("Error al obtener producto");
      }
      return response.json();
    },
    enabled: !!id,
  });
}
