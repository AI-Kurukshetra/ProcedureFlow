import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = `${environment.apiUrl}/notifications`;
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  getAll(unreadOnly = false): Observable<any> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return this.http.get<any>(`${this.api}${params}`).pipe(
      tap(r => this.unreadCount.set(r.unreadCount || 0))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.api}/unread-count`).pipe(
      map(r => r.data.count),
      tap(count => this.unreadCount.set(count))
    );
  }

  markRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/read`, {}).pipe(
      tap(() => this.unreadCount.update(n => Math.max(0, n - 1)))
    );
  }

  markAllRead(): Observable<any> {
    return this.http.patch<any>(`${this.api}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }
}
