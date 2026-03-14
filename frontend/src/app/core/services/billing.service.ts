import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiUrl = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  getSuggestions(procedureId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/suggestions/${procedureId}`).pipe(map((r) => r.data));
  }

  create(billing: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, billing).pipe(map((r) => r.data));
  }

  getByProcedure(procedureId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/procedure/${procedureId}`).pipe(map((r) => r.data));
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, data).pipe(map((r) => r.data));
  }
}
