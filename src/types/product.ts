export interface Product {
  id: string;
  code: string;
  name: string;
  nameProduct: string;
  price?: number | null;
  isActive: boolean;
  descriptionProduct?: string | null;
  businessTypeId?: string | null;
  businessType?: {
    id: string;
    name: string;
  } | null;
  brandId?: string | null;
  brand?: {
    id: string;
    name: string;
  } | null;
  modelId?: string | null;
  model?: {
    id: string;
    name: string;
  } | null;
  countryId?: string | null;
  country?: {
    id: string;
    name: string;
    code: string;
  } | null;
  currency: "BOB" | "USD" | "USDT";
  createdAt: Date;
  updatedAt: Date;
  images?: { url: string; isMain: boolean }[];
  validUntil?: string | null;
  // Additional fields for the forms
  specifications?: { feature: string; value: string }[];
  commercialCondition?: string | null;
  sellerDiscount?: number | null;
  managerDiscount?: number | null;
  savingsPlan?: {
    type?: string | null;
    firstQuota?: number | null;
    totalQuotas?: number | null;
  } | null;
}
