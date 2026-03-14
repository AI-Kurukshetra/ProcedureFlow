import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(filters: any = {}): Observable<any[]> {
    let query = this.supabase.client
      .from('schedules')
      .select('*')
      .is('deleted_at', null)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    if (filters.date) query = query.eq('scheduled_date', filters.date);
    if (filters.startDate) query = query.gte('scheduled_date', filters.startDate);
    if (filters.endDate) query = query.lte('scheduled_date', filters.endDate);
    if (filters.physicianId) query = query.eq('physician_id', filters.physicianId);
    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  getToday(): Observable<any[]> {
    const today = new Date().toISOString().slice(0, 10);
    return from(
      this.supabase.client
        .from('schedules')
        .select('*')
        .is('deleted_at', null)
        .eq('scheduled_date', today)
        .order('scheduled_time', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  getById(id: string): Observable<any> {
    return from(
      this.supabase.client.from('schedules').select('*').is('deleted_at', null).eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Schedule not found');
        return data;
      })
    );
  }

  create(data: any): Observable<any> {
    const user = this.authService.currentUser;
    return from(
      this.supabase.client
        .from('schedules')
        .insert({
          organization_id: data.organizationId || user?.organizationId,
          patient_id: data.patientId,
          physician_id: data.physicianId || user?.id,
          specialty_id: data.specialtyId,
          template_id: data.templateId || null,
          scheduled_date: data.scheduledDate,
          scheduled_time: data.scheduledTime,
          estimated_duration: data.estimatedDuration ?? 60,
          room: data.room,
          procedure_type: data.procedureType,
          status: data.status || 'scheduled',
          priority: data.priority || 'routine',
          notes: data.notes,
          pre_auth_number: data.preAuthNumber,
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to create schedule');
        return row;
      })
    );
  }

  update(id: string, data: any): Observable<any> {
    return from(
      this.supabase.client
        .from('schedules')
        .update({
          patient_id: data.patientId,
          physician_id: data.physicianId,
          specialty_id: data.specialtyId,
          template_id: data.templateId || null,
          scheduled_date: data.scheduledDate,
          scheduled_time: data.scheduledTime,
          estimated_duration: data.estimatedDuration,
          room: data.room,
          procedure_type: data.procedureType,
          status: data.status,
          priority: data.priority,
          notes: data.notes,
          pre_auth_number: data.preAuthNumber,
          cancel_reason: data.cancelReason,
        })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to update schedule');
        return row;
      })
    );
  }

  cancel(id: string, reason: string): Observable<any> {
    return from(
      this.supabase.client
        .from('schedules')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to cancel schedule');
        return row;
      })
    );
  }

  convertToProcedure(id: string): Observable<any> {
    return this.getById(id).pipe(
      switchMap((schedule) =>
        from(
          this.supabase.client
            .from('procedures')
            .insert({
              organization_id: schedule.organization_id,
              patient_id: schedule.patient_id,
              physician_id: schedule.physician_id,
              specialty_id: schedule.specialty_id,
              template_id: schedule.template_id || null,
              title: schedule.procedure_type,
              procedure_date: schedule.scheduled_date,
              notes: schedule.notes || '',
            })
            .select('*')
            .single()
        ).pipe(
          switchMap(({ data: procedure, error }) => {
            if (error || !procedure) throw error || new Error('Failed to create procedure');
            return from(
              this.supabase.client
                .from('schedules')
                .update({ status: 'in-progress', procedure_id: procedure.id })
                .eq('id', id)
                .select('*')
                .single()
            ).pipe(
              map(({ data: updated, error: updateError }) => {
                if (updateError || !updated) throw updateError || new Error('Failed to update schedule');
                return { procedure, schedule: updated };
              })
            );
          })
        )
      )
    );
  }

  getByPhysician(physicianId: string, date?: string): Observable<any[]> {
    let query = this.supabase.client
      .from('schedules')
      .select('*')
      .is('deleted_at', null)
      .eq('physician_id', physicianId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    if (date) query = query.eq('scheduled_date', date);
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }
}
