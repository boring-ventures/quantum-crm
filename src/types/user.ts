// Definiciones de tipos para usuarios
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role?: string;
  roleId?: string;
  userRole?: Role;
}

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserPayload = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateRolePayload = Omit<Role, "id" | "createdAt" | "updatedAt">;
export type UpdateRolePayload = Partial<CreateRolePayload>;
