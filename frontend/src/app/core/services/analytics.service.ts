import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getDashboard(): Observable<any> {
    const organizationId = this.authService.currentUser?.organizationId;
    const proceduresQuery = this.supabase.client
      .from('procedures')
      .select('quality_score', { count: 'exact' })
      .is('deleted_at', null);
    const patientsQuery = this.supabase.client
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (organizationId) {
      proceduresQuery.eq('organization_id', organizationId);
      patientsQuery.eq('organization_id', organizationId);
    }

    return from(
      Promise.all([proceduresQuery, patientsQuery])
    ).pipe(
      map(([proceduresRes, patientsRes]) => {
        if (proceduresRes.error) throw proceduresRes.error;
        if (patientsRes.error) throw patientsRes.error;
        const scores = (proceduresRes.data || [])
          .map((p: any) => p.quality_score)
          .filter((v: any) => typeof v === 'number');
        const avgQualityScore = scores.length
          ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10
          : null;
        return {
          stats: {
            totalProcedures: proceduresRes.count || 0,
            totalPatients: patientsRes.count || 0,
            avgQualityScore: avgQualityScore ?? 'N/A',
          },
        };
      })
    );
  }

  getProcedureStats(params: { startDate?: string; endDate?: string } = {}): Observable<any> {
    const organizationId = this.authService.currentUser?.organizationId;
    let query = this.supabase.client
      .from('procedures')
      .select('status, procedure_date')
      .is('deleted_at', null);
    if (organizationId) query = query.eq('organization_id', organizationId);
    if (params.startDate) query = query.gte('procedure_date', params.startDate);
    if (params.endDate) query = query.lte('procedure_date', params.endDate);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const counts: Record<string, number> = {};
        (data || []).forEach((row: any) => {
          counts[row.status] = (counts[row.status] || 0) + 1;
        });
        return {
          byStatus: Object.entries(counts).map(([status, count]) => ({ status, count })),
        };
      })
    );
  }

  getQualityMetrics(): Observable<any> {
    const organizationId = this.authService.currentUser?.organizationId;
    let query = this.supabase.client.from('procedures').select('quality_score').is('deleted_at', null);
    if (organizationId) query = query.eq('organization_id', organizationId);
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const scores = (data || [])
          .map((p: any) => p.quality_score)
          .filter((v: any) => typeof v === 'number');
        const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        return {
          avgQualityScore: Math.round(avg * 10) / 10,
          sampleSize: scores.length,
        };
      })
    );
  }

  getCompletionRates(): Observable<any> {
    const organizationId = this.authService.currentUser?.organizationId;
    let query = this.supabase.client.from('procedures').select('status').is('deleted_at', null);
    if (organizationId) query = query.eq('organization_id', organizationId);
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const total = data?.length || 0;
        const completed = (data || []).filter((p: any) => p.status === 'completed').length;
        const signed = (data || []).filter((p: any) => p.status === 'signed').length;
        const completionRate = total ? Math.round(((completed + signed) / total) * 100) : 0;
        return { total, completed, signed, completionRate };
      })
    );
  }
}
