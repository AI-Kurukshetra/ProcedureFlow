import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PatientFormData } from '../models/patient.model';
import { Procedure } from '../models/procedure.model';
import { ApiResponse, QueryParams } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  getAll(params: QueryParams = {}): Observable<ApiResponse<Patient[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, String(v)); });
    return this.http.get<ApiResponse<Patient[]>>(this.apiUrl, { params: httpParams });
  }

  getById(id: string): Observable<Patient> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data));
  }

  create(patient: PatientFormData): Observable<Patient> {
    return this.http.post<ApiResponse<Patient>>(this.apiUrl, patient).pipe(map((r) => r.data));
  }

  update(id: string, patient: Partial<PatientFormData>): Observable<Patient> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/${id}`, patient).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getProcedureHistory(id: string): Observable<Procedure[]> {
    return this.http.get<ApiResponse<Procedure[]>>(`${this.apiUrl}/${id}/procedures`).pipe(map((r) => r.data));
  }
}
