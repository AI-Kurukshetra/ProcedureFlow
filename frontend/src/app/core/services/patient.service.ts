import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Patient, PatientFormData } from '../models/patient.model';
import { Procedure } from '../models/procedure.model';
import { ApiResponse, QueryParams } from '../models/template.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(params: QueryParams = {}): Observable<ApiResponse<Patient[]>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;
    const organizationId = this.authService.currentUser?.organizationId;

    let query = this.supabase.client
      .from('patients')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (params.search) {
      const term = String(params.search).trim();
      if (term) {
        query = query.or(
          `mrn.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
        );
      }
    }

    return from(query).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        const items = (data || []).map((row) => this.mapPatient(row));
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

  getById(id: string): Observable<Patient> {
    return from(
      this.supabase.client.from('patients').select('*').is('deleted_at', null).eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Patient not found');
        return this.mapPatient(data);
      })
    );
  }

  create(patient: PatientFormData): Observable<Patient> {
    const organizationId = this.authService.currentUser?.organizationId;
    return from(
      this.supabase.client
        .from('patients')
        .insert({
          organization_id: organizationId,
          mrn: patient.mrn,
          first_name: patient.firstName,
          last_name: patient.lastName,
          date_of_birth: patient.dateOfBirth,
          gender: patient.gender,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          emr_id: patient.emrId,
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to create patient');
        return this.mapPatient(data);
      })
    );
  }

  update(id: string, patient: Partial<PatientFormData>): Observable<Patient> {
    return from(
      this.supabase.client
        .from('patients')
        .update({
          mrn: patient.mrn,
          first_name: patient.firstName,
          last_name: patient.lastName,
          date_of_birth: patient.dateOfBirth,
          gender: patient.gender,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          emr_id: patient.emrId,
        })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to update patient');
        return this.mapPatient(data);
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client.from('patients').delete().eq('id', id)
    ).pipe(map(({ error }) => {
      if (error) throw error;
    }));
  }

  getProcedureHistory(id: string): Observable<Procedure[]> {
    return from(
      this.supabase.client
        .from('procedures')
        .select('*')
        .is('deleted_at', null)
        .eq('patient_id', id)
        .order('procedure_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row) => this.mapProcedure(row));
      })
    );
  }

  private mapPatient(row: any): Patient {
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

  private mapProcedure(row: any): Procedure {
    return {
      id: row.id,
      patientId: row.patient_id,
      physicianId: row.physician_id,
      templateId: row.template_id || undefined,
      specialtyId: row.specialty_id,
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
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };
  }
}
