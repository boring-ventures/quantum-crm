// Definición de tipos para países

export interface Country {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
  };
}

export interface CountryWithUsers extends Country {
  users: { id: string }[];
}

export interface CountryFormValues {
  name: string;
  code: string;
}
