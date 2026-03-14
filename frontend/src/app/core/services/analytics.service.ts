import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`).pipe(map((r) => r.data));
  }

  getProcedureStats(params: { startDate?: string; endDate?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/procedures`, { params: httpParams }).pipe(map((r) => r.data));
  }

  getQualityMetrics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/quality`).pipe(map((r) => r.data));
  }

  getCompletionRates(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/completion-rates`).pipe(map((r) => r.data));
  }
}
