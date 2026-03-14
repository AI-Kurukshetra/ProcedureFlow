import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Procedure, ProcedureFormData, ProcedureImage, ProcedureStatus } from '../models/procedure.model';
import { ApiResponse, QueryParams } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private readonly apiUrl = `${environment.apiUrl}/procedures`;

  constructor(private http: HttpClient) {}

  getAll(params: QueryParams = {}): Observable<ApiResponse<Procedure[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, String(v)); });
    return this.http.get<ApiResponse<Procedure[]>>(this.apiUrl, { params: httpParams });
  }

  getById(id: string): Observable<Procedure> {
    return this.http.get<ApiResponse<Procedure>>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data));
  }

  create(procedure: ProcedureFormData): Observable<Procedure> {
    return this.http.post<ApiResponse<Procedure>>(this.apiUrl, procedure).pipe(map((r) => r.data));
  }

  update(id: string, data: Partial<ProcedureFormData>): Observable<Procedure> {
    return this.http.put<ApiResponse<Procedure>>(`${this.apiUrl}/${id}`, data).pipe(map((r) => r.data));
  }

  updateStatus(id: string, status: ProcedureStatus): Observable<Procedure> {
    return this.http.patch<ApiResponse<Procedure>>(`${this.apiUrl}/${id}/status`, { status }).pipe(map((r) => r.data));
  }

  autoSave(id: string, data: Partial<ProcedureFormData>): Observable<{ savedAt: string }> {
    return this.http.post<ApiResponse<{ savedAt: string }>>(`${this.apiUrl}/${id}/auto-save`, data).pipe(map((r) => r.data));
  }

  addImage(id: string, file: File): Observable<ProcedureImage> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ApiResponse<ProcedureImage>>(`${this.apiUrl}/${id}/images`, formData).pipe(map((r) => r.data));
  }

  removeImage(id: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/images/${imageId}`);
  }

  getByPatient(patientId: string): Observable<Procedure[]> {
    return this.http.get<ApiResponse<Procedure[]>>(`${this.apiUrl}/by-patient/${patientId}`).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
