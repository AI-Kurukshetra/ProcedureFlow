import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(filters: any = {}): Observable<any[]> {
    let query = this.supabase.client
      .from('consents')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.procedureId) query = query.eq('procedure_id', filters.procedureId);
    if (filters.isValid != null) query = query.eq('is_valid', filters.isValid);
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  getById(id: string): Observable<any> {
    return from(
      this.supabase.client.from('consents').select('*').is('deleted_at', null).eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Consent not found');
        return data;
      })
    );
  }

  getByPatient(patientId: string): Observable<any[]> {
    return from(
      this.supabase.client
        .from('consents')
        .select('*')
        .is('deleted_at', null)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  create(data: any): Observable<any> {
    return from(
      this.supabase.client
        .from('consents')
        .insert({
          patient_id: data.patientId || data.patient_id,
          procedure_id: data.procedureId || data.procedure_id || null,
          consent_type: data.consentType || data.consent_type,
          signature_data: data.signatureData || data.signature_data || null,
          signed_at: data.signedAt || data.signed_at || null,
          witness_id: data.witnessId || data.witness_id || this.authService.currentUser?.id || null,
          is_valid: data.isValid ?? true,
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to create consent');
        return row;
      })
    );
  }

  sign(id: string, signatureData: string, signerName: string): Observable<any> {
    return from(
      this.supabase.client
        .from('consents')
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          witness_id: this.authService.currentUser?.id || null,
        })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to sign consent');
        return { ...data, signerName };
      })
    );
  }

  revoke(id: string, reason: string): Observable<any> {
    return from(
      this.supabase.client
        .from('consents')
        .update({ is_valid: false })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to revoke consent');
        return { ...data, revokeReason: reason };
      })
    );
  }
}
