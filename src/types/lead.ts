// Tipos principales basados en el schema de Prisma
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  company?: string;
  product?: string;
  statusId: string;
  sourceId: string;
  assignedToId?: string;
  interest?: string;
  extraComments?: string;
  qualityScore?: number;
  qualification?: "NOT_QUALIFIED" | "GOOD_LEAD" | "BAD_LEAD";
  isArchived?: boolean;
  isClosed?: boolean;
  closedAt?: Date | null;
  reasonClosed?: string | null;
  isFavorite?: boolean;
  favoriteAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadStatus {
  id: string;
  name: string;
  description?: string;
  color: string;
  displayOrder: number;
  conversionRate?: number;
  isActive: boolean;
}

export interface SourceCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  sources?: LeadSource[];
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  costPerSource?: number | string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  category?: SourceCategory;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Definición del tipo Task
export interface Task {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  leadId: string;
  assignedToId: string;
  completedAt?: string | null;
  description?: string;
  scheduledFor?: string | null;
}

// Definir User localmente para evitar problemas de importación
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  isActive?: boolean;
}

export interface Company {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

// Tipos para operaciones CRUD
export type CreateLeadPayload = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadPayload = Partial<CreateLeadPayload>;

// Interfaz para el seguimiento de reasignaciones de leads
export interface LeadReassignment {
  id: string;
  createdAt: Date;
  leadId: string;
  fromUserId: string;
  toUserId: string;
  reassignedBy: string;
  reason?: string;
  fromUser?: User;
  toUser?: User;
  reassignedByUser?: User;
}

// Tipo para documentos
export interface Document {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  type: string;
  size: number;
  url: string;
  leadId: string;
  source?: "document" | "quotation" | "reservation" | "sale";
}

// Interfaces para respuestas API con relaciones
export interface LeadWithRelations extends Lead {
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: User;
  tags?: Tag[];
  tasks?: Task[];
  quotations?: Quotation[];
  reservations?: Reservation[];
  sales?: Sale[];
  reassignments?: LeadReassignment[];
  documents?: Document[];
}

// Tipos para respuestas de API paginadas
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadsResponse {
  items: LeadWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Quotation {
  id: string;
  leadId: string;
  totalAmount: string | number;
  proformaUrl?: string;
  additionalNotes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  leadId: string;
  quotationId?: string;
  amount: string | number;
  paymentMethod: string;
  deliveryDate: Date;
  reservationFormUrl?: string;
  depositReceiptUrl?: string;
  reservationContractUrl?: string;
  vehicleDetails?: string;
  additionalNotes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  leadId: string;
  reservationId?: string;
  amount: string | number;
  paymentMethod: string;
  saleContractUrl?: string;
  additionalNotes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
