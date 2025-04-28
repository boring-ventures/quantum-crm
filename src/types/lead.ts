// Tipos principales basados en el schema de Prisma
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  statusId: string;
  sourceId: string;
  assignedToId?: string;
  interest?: string;
  extraComments?: string;
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
}

export interface LeadSource {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Definir User localmente para evitar problemas de importación
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  isActive?: boolean;
}

// Tipos para operaciones CRUD
export type CreateLeadPayload = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadPayload = Partial<CreateLeadPayload>;

// Interfaces para respuestas API con relaciones
export interface LeadWithRelations extends Lead {
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: User;
  tags?: Tag[];
}

// Tipos para respuestas de API paginadas
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadsResponse extends PaginatedResponse<LeadWithRelations> {}
