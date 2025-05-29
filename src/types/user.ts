import type { Role } from "@/types/role";

// Estructura para UserPermission
export type UserPermission = {
  id: string;
  userId: string;
  permissions: any; // Tipo genérico para admitir diferentes estructuras JSON
  createdAt?: string;
  updatedAt?: string;
};

// Definiciones de tipos para usuarios
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  conversionRate: number | null;
  responseTime: number | null;
  roleId: string | null;
  countryId: string | null;
  userPermission?: {
    id: string;
    userId: string;
    permissions: any;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export type CreateUserPayload = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateRolePayload = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type UpdateRolePayload = Partial<CreateRolePayload>;
