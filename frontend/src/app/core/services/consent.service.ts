import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private api = `${environment.apiUrl}/consents`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v as string); });
    return this.http.get<any>(this.api, { params }).pipe(map(r => r.data));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  getByPatient(patientId: string): Observable<any[]> {
    return this.http.get<any>(`${this.api}/patient/${patientId}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  sign(id: string, signatureData: string, signerName: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/sign`, { signatureData, signerName }).pipe(map(r => r.data));
  }

  revoke(id: string, reason: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/revoke`, { reason }).pipe(map(r => r.data));
  }
}
