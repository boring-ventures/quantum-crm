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
export type User = {
  id: string;
  name: string;
  email: string;
  roleId?: string | null;
  role?: string;
  isActive: boolean;
  userRole?: Role;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
  countryId?: string;
  userPermission?: UserPermission;
};

export type CreateUserPayload = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateRolePayload = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type UpdateRolePayload = Partial<CreateRolePayload>;
