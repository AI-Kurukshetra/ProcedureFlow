export interface Patient {
  id: string;
  organizationId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  insuranceInfo?: Record<string, any>;
  emrId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientFormData {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  emrId?: string;
}
