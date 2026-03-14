import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  generate(procedureId: string, type: 'pdf' | 'hl7' | 'structured' = 'pdf'): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate`, { procedureId, type }).pipe(map((r) => r.data));
  }

  getByProcedure(procedureId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/procedure/${procedureId}`).pipe(map((r) => r.data));
  }

  download(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/download`, { responseType: 'blob' });
  }
}
