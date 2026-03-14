import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly reportsBucket = 'reports';

  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  generate(procedureId: string, type: 'pdf' | 'hl7' | 'structured' = 'pdf'): Observable<any> {
    const userId = this.authService.currentUser?.id;
    return from(
      this.supabase.client
        .from('reports')
        .insert({
          procedure_id: procedureId,
          type,
          content: '',
          generated_by: userId,
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to generate report');
        return data;
      })
    );
  }

  getByProcedure(procedureId: string): Observable<any[]> {
    return from(
      this.supabase.client
        .from('reports')
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

  download(reportId: string): Observable<Blob> {
    return from(
      this.supabase.client.from('reports').select('*').is('deleted_at', null).eq('id', reportId).single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) throw error || new Error('Report not found');
        if (data.file_path) {
          return from(this.supabase.client.storage.from(this.reportsBucket).download(data.file_path)).pipe(
            map(({ data: file, error: storageError }) => {
              if (storageError || !file) throw storageError || new Error('Failed to download report');
              return file as Blob;
            })
          );
        }
        const content = data.content || '';
        return from(Promise.resolve(new Blob([content], { type: 'text/plain' })));
      })
    );
  }
}
