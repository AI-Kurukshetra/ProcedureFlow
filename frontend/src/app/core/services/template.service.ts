import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Template } from '../models/template.model';
import { ApiResponse, QueryParams } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly apiUrl = `${environment.apiUrl}/templates`;

  constructor(private http: HttpClient) {}

  getAll(params: QueryParams = {}): Observable<Template[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, String(v)); });
    return this.http.get<ApiResponse<Template[]>>(this.apiUrl, { params: httpParams }).pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Template> {
    return this.http.get<ApiResponse<Template>>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data));
  }

  getBySpecialty(specialtyId: string): Observable<Template[]> {
    return this.http.get<ApiResponse<Template[]>>(`${this.apiUrl}/specialty/${specialtyId}`).pipe(map((r) => r.data));
  }

  create(template: Partial<Template>): Observable<Template> {
    return this.http.post<ApiResponse<Template>>(this.apiUrl, template).pipe(map((r) => r.data));
  }

  update(id: string, template: Partial<Template>): Observable<Template> {
    return this.http.put<ApiResponse<Template>>(`${this.apiUrl}/${id}`, template).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  clone(id: string): Observable<Template> {
    return this.http.post<ApiResponse<Template>>(`${this.apiUrl}/${id}/clone`, {}).pipe(map((r) => r.data));
  }
}
