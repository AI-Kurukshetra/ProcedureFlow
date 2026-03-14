import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { Procedure, ProcedureFormData, ProcedureImage, ProcedureStatus } from '../models/procedure.model';
import { ApiResponse, QueryParams } from '../models/template.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private readonly imagesBucket = 'procedure-images';

  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(params: QueryParams = {}): Observable<ApiResponse<Procedure[]>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;
    const organizationId = this.authService.currentUser?.organizationId;

    let query = this.supabase.client
      .from('procedures')
      .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)', { count: 'exact' })
      .is('deleted_at', null)
      .order('procedure_date', { ascending: false })
      .range(fromIndex, toIndex);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (params['status']) {
      query = query.eq('status', params['status']);
    }

    return from(query).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        const items = (data || []).map((row) => this.mapProcedure(row));
        return {
          success: true,
          data: items,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: count ? Math.ceil(count / limit) : 0,
          },
        };
      })
    );
  }

  getById(id: string): Observable<Procedure> {
    return from(
      this.supabase.client
        .from('procedures')
        .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)')
        .is('deleted_at', null)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Procedure not found');
        return this.mapProcedure(data);
      })
    );
  }

  create(procedure: ProcedureFormData): Observable<Procedure> {
    const user = this.authService.currentUser;
    return from(
      this.supabase.client
        .from('procedures')
        .insert({
          patient_id: procedure.patientId,
          physician_id: user?.id,
          template_id: procedure.templateId || null,
          specialty_id: procedure.specialtyId,
          organization_id: user?.organizationId,
          title: procedure.title,
          procedure_date: procedure.procedureDate,
          notes: procedure.notes,
          findings: procedure.findings,
          impression: procedure.impression,
          complications: procedure.complications,
          documentation_data: procedure.documentationData || {},
        })
        .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to create procedure');
        return this.mapProcedure(data);
      })
    );
  }

  update(id: string, data: Partial<ProcedureFormData>): Observable<Procedure> {
    return from(
      this.supabase.client
        .from('procedures')
        .update({
          patient_id: data.patientId,
          template_id: data.templateId || null,
          specialty_id: data.specialtyId,
          title: data.title,
          procedure_date: data.procedureDate,
          notes: data.notes,
          findings: data.findings,
          impression: data.impression,
          complications: data.complications,
          documentation_data: data.documentationData || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to update procedure');
        return this.mapProcedure(row);
      })
    );
  }

  updateStatus(id: string, status: ProcedureStatus): Observable<Procedure> {
    return from(
      this.supabase.client
        .from('procedures')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to update status');
        return this.mapProcedure(data);
      })
    );
  }

  autoSave(id: string, data: Partial<ProcedureFormData>): Observable<{ savedAt: string }> {
    const savedAt = new Date().toISOString();
    return from(
      this.supabase.client
        .from('procedures')
        .update({
          notes: data.notes,
          findings: data.findings,
          impression: data.impression,
          complications: data.complications,
          documentation_data: data.documentationData || {},
          updated_at: savedAt,
        })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return { savedAt };
      })
    );
  }

  addImage(id: string, file: File): Observable<ProcedureImage> {
    const filePath = `procedures/${id}/${Date.now()}_${file.name}`;
    return from(
      this.supabase.client.storage.from(this.imagesBucket).upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return from(
          this.supabase.client
            .from('procedure_images')
            .insert({
              procedure_id: id,
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            })
            .select('*')
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to save image metadata');
        return this.mapProcedureImage(data);
      })
    );
  }

  removeImage(id: string, imageId: string): Observable<void> {
    return from(
      this.supabase.client
        .from('procedure_images')
        .select('*')
        .is('deleted_at', null)
        .eq('id', imageId)
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) throw error || new Error('Image not found');
        return from(
          Promise.all([
            this.supabase.client.storage.from(this.imagesBucket).remove([data.file_path]),
            this.supabase.client.from('procedure_images').delete().eq('id', imageId),
          ])
        );
      }),
      map(([storageResult, deleteResult]) => {
        if (storageResult.error) throw storageResult.error;
        if (deleteResult.error) throw deleteResult.error;
      })
    );
  }

  getByPatient(patientId: string): Observable<Procedure[]> {
    return from(
      this.supabase.client
        .from('procedures')
        .select('*, patient:patients(*), specialty:specialties(*), physician:users(*), template:templates(*), images:procedure_images(*)')
        .is('deleted_at', null)
        .eq('patient_id', patientId)
        .order('procedure_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row) => this.mapProcedure(row));
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client.from('procedures').delete().eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  private mapProcedure(row: any): Procedure {
    return {
      id: row.id,
      patientId: row.patient_id,
      patient: row.patient ? this.mapPatient(row.patient) : undefined,
      physicianId: row.physician_id,
      physician: row.physician ? this.mapUser(row.physician) : undefined,
      templateId: row.template_id || undefined,
      template: row.template ? this.mapTemplate(row.template) : undefined,
      specialtyId: row.specialty_id,
      specialty: row.specialty
        ? { id: row.specialty.id, name: row.specialty.name, code: row.specialty.code }
        : undefined,
      organizationId: row.organization_id,
      status: row.status,
      title: row.title,
      procedureDate: row.procedure_date,
      startTime: row.start_time || undefined,
      endTime: row.end_time || undefined,
      notes: row.notes || undefined,
      findings: row.findings || undefined,
      impression: row.impression || undefined,
      complications: row.complications || undefined,
      medications: row.medications || undefined,
      equipment: row.equipment || undefined,
      documentationData: row.documentation_data || undefined,
      qualityScore: row.quality_score || undefined,
      images: row.images ? row.images.map((img: any) => this.mapProcedureImage(img)) : undefined,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };
  }

  private mapProcedureImage(row: any): ProcedureImage {
    return {
      id: row.id,
      procedureId: row.procedure_id,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      annotation: row.annotation || undefined,
      capturedAt: row.captured_at,
    };
  }

  private mapPatient(row: any) {
    return {
      id: row.id,
      organizationId: row.organization_id,
      mrn: row.mrn,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      address: row.address || undefined,
      insuranceInfo: row.insurance_info || undefined,
      emrId: row.emr_id || undefined,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };
  }

  private mapUser(row: any) {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      specialtyId: row.specialty_id || undefined,
      organizationId: row.organization_id,
      isActive: row.is_active,
      lastLogin: row.last_login || undefined,
      createdAt: row.created_at || undefined,
    };
  }

  private mapTemplate(row: any) {
    return {
      id: row.id,
      organizationId: row.organization_id,
      specialtyId: row.specialty_id,
      name: row.name,
      description: row.description || undefined,
      fields: row.fields || [],
      isActive: row.is_active,
      version: row.version,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };
  }
}
