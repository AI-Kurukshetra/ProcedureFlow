import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private api = `${environment.apiUrl}/scheduling`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<any>(this.api, { params }).pipe(map(r => r.data));
  }

  getToday(): Observable<any[]> {
    return this.http.get<any>(`${this.api}/today`).pipe(map(r => r.data));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, data).pipe(map(r => r.data));
  }

  cancel(id: string, reason: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/cancel`, { reason }).pipe(map(r => r.data));
  }

  convertToProcedure(id: string): Observable<any> {
    return this.http.post<any>(`${this.api}/${id}/convert`, {}).pipe(map(r => r.data));
  }

  getByPhysician(physicianId: string, date?: string): Observable<any[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<any>(`${this.api}/physician/${physicianId}`, { params }).pipe(map(r => r.data));
  }
}
