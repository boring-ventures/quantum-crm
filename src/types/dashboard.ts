// Definiciones de tipos para secciones del dashboard

export interface DashboardSection {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  url: string;
  parentKey?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDashboardSectionPayload = Omit<
  DashboardSection,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateDashboardSectionPayload =
  Partial<CreateDashboardSectionPayload>;

// Formato de permisos para roles
export interface SectionPermission {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface SectionPermissions {
  [key: string]: SectionPermission;
}

export interface NestedSectionPermissions {
  sections: {
    [key: string]:
      | SectionPermission
      | {
          [subKey: string]: SectionPermission;
        };
  };
}
