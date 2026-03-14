import { Injectable, signal } from '@angular/core';
import { Observable, from, map, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unreadCount = signal(0);

  constructor(private supabase: SupabaseService, private authService: AuthService) {}

  getAll(unreadOnly = false): Observable<any> {
    const userId = this.authService.currentUser?.id;
    let query = this.supabase.client
      .from('notifications')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (unreadOnly) query = query.eq('is_read', false);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const unreadCount = (data || []).filter((n: any) => !n.is_read).length;
        return { success: true, data: data || [], unreadCount };
      }),
      tap((r) => this.unreadCount.set(r.unreadCount || 0))
    );
  }

  getUnreadCount(): Observable<number> {
    const userId = this.authService.currentUser?.id;
    return from(
      this.supabase.client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId || '')
        .is('deleted_at', null)
        .eq('is_read', false)
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      tap((count) => this.unreadCount.set(count))
    );
  }

  markRead(id: string): Observable<any> {
    return from(
      this.supabase.client
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      tap(() => this.unreadCount.update((n) => Math.max(0, n - 1)))
    );
  }

  markAllRead(): Observable<any> {
    const userId = this.authService.currentUser?.id;
    return from(
      this.supabase.client
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId || '')
    ).pipe(tap(() => this.unreadCount.set(0)));
  }

  delete(id: string): Observable<any> {
    return from(
      this.supabase.client.from('notifications').delete().eq('id', id)
    );
  }
}
