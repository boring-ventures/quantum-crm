export type Role = {
  id: string;
  name: string;
  permissions: Record<string, any>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
