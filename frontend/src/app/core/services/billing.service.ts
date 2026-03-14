import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class BillingService {
  constructor(private supabase: SupabaseService) {}

  getSuggestions(procedureId: string): Observable<any[]> {
    return from(
      this.supabase.client
        .from('billing_codes')
        .select('*')
        .is('deleted_at', null)
        .eq('procedure_id', procedureId)
        .eq('status', 'suggested')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  create(billing: any): Observable<any> {
    return from(
      this.supabase.client
        .from('billing_codes')
        .insert({
          procedure_id: billing.procedureId || billing.procedure_id,
          cpt_code: billing.cptCode || billing.cpt_code,
          icd_code: billing.icdCode || billing.icd_code,
          description: billing.description,
          amount: billing.amount,
          status: billing.status || 'suggested',
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to create billing entry');
        return data;
      })
    );
  }

  getByProcedure(procedureId: string): Observable<any[]> {
    return from(
      this.supabase.client
        .from('billing_codes')
        .select('*')
        .is('deleted_at', null)
        .eq('procedure_id', procedureId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  update(id: string, data: any): Observable<any> {
    return from(
      this.supabase.client
        .from('billing_codes')
        .update({
          cpt_code: data.cptCode || data.cpt_code,
          icd_code: data.icdCode || data.icd_code,
          description: data.description,
          amount: data.amount,
          status: data.status,
        })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to update billing entry');
        return row;
      })
    );
  }
}
