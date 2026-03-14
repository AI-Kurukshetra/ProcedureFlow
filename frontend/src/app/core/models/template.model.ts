export type FieldType = 'text' | 'textarea' | 'checkbox' | 'select' | 'number' | 'date' | 'radio' | 'image';

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
}

export interface Template {
  id: string;
  organizationId: string;
  specialtyId: string;
  specialty?: { id: string; name: string; code: string };
  name: string;
  description?: string;
  fields: TemplateField[];
  isActive: boolean;
  version: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}
