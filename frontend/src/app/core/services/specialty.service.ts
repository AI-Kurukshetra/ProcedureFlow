import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/template.model';
import { Specialty } from '../models/specialty.model';

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  private api = `${environment.apiUrl}/specialties`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Specialty[]> {
    return this.http.get<ApiResponse<Specialty[]>>(this.api).pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Specialty> {
    return this.http.get<ApiResponse<Specialty>>(`${this.api}/${id}`).pipe(map((r) => r.data));
  }
}
