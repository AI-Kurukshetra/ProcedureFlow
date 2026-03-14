import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Specialty } from '../models/specialty.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  constructor(private supabase: SupabaseService) {}

  getAll(): Observable<Specialty[]> {
    return from(
      this.supabase.client
        .from('specialties')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row) => this.mapSpecialty(row));
      })
    );
  }

  getById(id: string): Observable<Specialty> {
    return from(
      this.supabase.client.from('specialties').select('*').is('deleted_at', null).eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('Specialty not found');
        return this.mapSpecialty(data);
      })
    );
  }

  private mapSpecialty(row: any): Specialty {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description || undefined,
      isActive: row.is_active ?? undefined,
    };
  }
}
