import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, v as string); });
    return this.http.get<any>(this.api, { params });
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

  deactivate(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/deactivate`, {}).pipe(map(r => r.data));
  }

  activate(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/activate`, {}).pipe(map(r => r.data));
  }

  resetPassword(id: string, newPassword: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/reset-password`, { newPassword }).pipe(map(r => r.data));
  }
}
