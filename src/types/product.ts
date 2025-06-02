export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  description?: string;
  businessTypeId?: string;
  businessType?: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  brand?: {
    id: string;
    name: string;
  } | null;
  model?: {
    id: string;
    name: string;
  } | null;
  validUntil?: string | null;
  images?: { url: string; isMain: boolean }[];
  currency?: "BOB" | "USD" | "USDT";
  country?: {
    id: string;
    name: string;
    code: string;
  } | null;
}
