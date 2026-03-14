import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { Template, QueryParams } from '../models/template.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(params: QueryParams = {}): Observable<Template[]> {
    const organizationId = this.authService.currentUser?.organizationId;
    let query = this.supabase.client
      .from('templates')
      .select('*, specialty:specialties(id,name,code)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (params['specialtyId']) query = query.eq('specialty_id', params['specialtyId']);
    if (params.search) query = query.ilike('name', `%${params.search}%`);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row) => this.mapTemplate(row));
      })
    );
  }

  getById(id: string): Observable<Template> {
    return from(
      this.supabase.client
        .from('templates')
        .select('*, specialty:specialties(id,name,code)')
        .is('deleted_at', null)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Template not found');
        return this.mapTemplate(data);
      })
    );
  }

  getBySpecialty(specialtyId: string): Observable<Template[]> {
    return from(
      this.supabase.client
        .from('templates')
        .select('*, specialty:specialties(id,name,code)')
        .is('deleted_at', null)
        .eq('specialty_id', specialtyId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row) => this.mapTemplate(row));
      })
    );
  }

  create(template: Partial<Template>): Observable<Template> {
    const user = this.authService.currentUser;
    return from(
      this.supabase.client
        .from('templates')
        .insert({
          organization_id: user?.organizationId,
          specialty_id: template.specialtyId,
          name: template.name,
          description: template.description,
          fields: template.fields || [],
          is_active: template.isActive ?? true,
          version: template.version || 1,
          created_by: user?.id,
        })
        .select('*, specialty:specialties(id,name,code)')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to create template');
        return this.mapTemplate(data);
      })
    );
  }

  update(id: string, template: Partial<Template>): Observable<Template> {
    return from(
      this.supabase.client
        .from('templates')
        .update({
          specialty_id: template.specialtyId,
          name: template.name,
          description: template.description,
          fields: template.fields,
          is_active: template.isActive,
          version: template.version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, specialty:specialties(id,name,code)')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Failed to update template');
        return this.mapTemplate(data);
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client.from('templates').delete().eq('id', id)
    ).pipe(map(({ error }) => {
      if (error) throw error;
    }));
  }

  clone(id: string): Observable<Template> {
    return this.getById(id).pipe(
      switchMap((template) =>
        this.create({
          ...template,
          id: undefined,
          name: `${template.name} (Copy)`,
          version: (template.version || 1) + 1,
        })
      )
    );
  }

  private mapTemplate(row: any): Template {
    return {
      id: row.id,
      organizationId: row.organization_id,
      specialtyId: row.specialty_id,
      specialty: row.specialty
        ? { id: row.specialty.id, name: row.specialty.name, code: row.specialty.code }
        : undefined,
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
