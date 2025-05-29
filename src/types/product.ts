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
  };
  createdAt: Date;
  updatedAt: Date;
}
