import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(filters: any = {}): Observable<any> {
    const organizationId = this.authService.currentUser?.organizationId;
    let query = this.supabase.client
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (organizationId) query = query.eq('organization_id', organizationId);
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.search) {
      const term = String(filters.search).trim();
      if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
    }
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { success: true, data: data || [] };
      })
    );
  }

  getById(id: string): Observable<any> {
    return from(
      this.supabase.client.from('users').select('*').is('deleted_at', null).eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('User not found');
        return data;
      })
    );
  }

  create(data: any): Observable<any> {
    return from(
      this.supabase.client
        .from('users')
        .insert({
          first_name: data.firstName || data.first_name,
          last_name: data.lastName || data.last_name,
          email: data.email,
          password_hash: data.passwordHash || data.password_hash || 'supabase-auth',
          role: data.role || 'physician',
          specialty_id: data.specialtyId || data.specialty_id || null,
          organization_id: data.organizationId || data.organization_id || this.authService.currentUser?.organizationId,
          is_active: data.isActive ?? true,
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to create user');
        return row;
      })
    );
  }

  update(id: string, data: any): Observable<any> {
    return from(
      this.supabase.client
        .from('users')
        .update({
          first_name: data.firstName || data.first_name,
          last_name: data.lastName || data.last_name,
          role: data.role,
          specialty_id: data.specialtyId || data.specialty_id,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error || !row) throw error || new Error('Failed to update user');
        return row;
      })
    );
  }

  deactivate(id: string): Observable<any> {
    return from(
      this.supabase.client.from('users').update({ is_active: false }).eq('id', id).select('*').single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to deactivate user');
        return data;
      })
    );
  }

  activate(id: string): Observable<any> {
    return from(
      this.supabase.client.from('users').update({ is_active: true }).eq('id', id).select('*').single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to activate user');
        return data;
      })
    );
  }

  resetPassword(id: string, newPassword: string): Observable<any> {
    return this.authService.currentUser?.id === id
      ? from(this.supabase.client.auth.updateUser({ password: newPassword })).pipe(
          switchMap(({ error }) => {
            if (error) throw error;
            return this.getById(id);
          })
        )
      : from(Promise.reject(new Error('Password reset requires the user to be signed in.')));
  }
}
