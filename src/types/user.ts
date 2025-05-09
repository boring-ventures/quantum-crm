import type { Role } from "@/types/role";

// Definiciones de tipos para usuarios
export type User = {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  role?: string;
  isActive: boolean;
  userRole?: Role;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
};

export type CreateUserPayload = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateRolePayload = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type UpdateRolePayload = Partial<CreateRolePayload>;
