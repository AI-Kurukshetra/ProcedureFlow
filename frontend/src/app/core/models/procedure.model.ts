import { Patient } from './patient.model';
import { User } from './user.model';
import { Template } from './template.model';

export type ProcedureStatus = 'draft' | 'in-progress' | 'completed' | 'signed';

export interface Procedure {
  id: string;
  patientId: string;
  patient?: Patient;
  physicianId: string;
  physician?: User;
  templateId?: string;
  template?: Template;
  specialtyId: string;
  specialty?: { id: string; name: string; code: string };
  organizationId: string;
  status: ProcedureStatus;
  title: string;
  procedureDate: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  findings?: string;
  impression?: string;
  complications?: string;
  medications?: any[];
  equipment?: any[];
  documentationData?: Record<string, any>;
  qualityScore?: number;
  images?: ProcedureImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcedureImage {
  id: string;
  procedureId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  annotation?: Record<string, any>;
  capturedAt: string;
}

export interface ProcedureFormData {
  patientId: string;
  templateId?: string;
  specialtyId: string;
  title: string;
  procedureDate: string;
  notes?: string;
  findings?: string;
  impression?: string;
  complications?: string;
  documentationData?: Record<string, any>;
}
