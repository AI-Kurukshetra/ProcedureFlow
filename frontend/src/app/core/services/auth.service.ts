import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, map, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, LoginCredentials } from '../models/user.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map((u) => !!u));

  constructor(private supabase: SupabaseService, private router: Router) {
    this.restoreSession();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.email) {
        this.clearAuth();
        return;
      }
      this.loadProfileByEmail(session.user.email).subscribe({
        next: (user) => {
          this.persistAuth(user, session.access_token, session.refresh_token, session.expires_in);
        },
        error: () => {
          this.clearAuth();
        },
      });
    });
  }

  private loadUser(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.session || !data.user?.email) {
          throw error || new Error('Login failed');
        }
        return this.loadProfileByEmail(data.user.email).pipe(
          map((user) => ({
            user,
            accessToken: data.session?.access_token || '',
            refreshToken: data.session?.refresh_token || '',
            expiresIn: data.session?.expires_in || 0,
          }))
        );
      }),
      tap((data) => this.persistAuth(data.user, data.accessToken, data.refreshToken, data.expiresIn)),
      catchError((err) => throwError(() => err?.message || 'Login failed'))
    );
  }

  logout(): void {
    this.supabase.client.auth.signOut().finally(() => {
      this.clearAuth();
      this.router.navigate(['/login']);
    });
  }

  refreshToken(): Observable<AuthResponse> {
    return from(this.supabase.client.auth.refreshSession()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.session) {
          throw error || new Error('Session refresh failed');
        }
        return this.loadProfileByEmail(data.user?.email || '').pipe(
          map((user) => ({
            user,
            accessToken: data.session?.access_token || '',
            refreshToken: data.session?.refresh_token || '',
            expiresIn: data.session?.expires_in || 0,
          }))
        );
      }),
      tap((data) => this.persistAuth(data.user, data.accessToken, data.refreshToken, data.expiresIn))
    );
  }

  getProfile(): Observable<User> {
    return from(this.supabase.client.auth.getSession()).pipe(
      switchMap(({ data }) => {
        const email = data.session?.user?.email;
        if (!email) return throwError(() => new Error('No active session'));
        return this.loadProfileByEmail(email);
      }),
      tap((user) => this.persistAuth(user))
    );
  }

  hasRole(...roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  private restoreSession(): void {
    from(this.supabase.client.auth.getSession()).subscribe({
      next: ({ data }) => {
        const email = data.session?.user?.email;
        if (!email) return;
        this.loadProfileByEmail(email).subscribe({
          next: (user) => {
            this.persistAuth(
              user,
              data.session?.access_token,
              data.session?.refresh_token,
              data.session?.expires_in
            );
          },
        });
      },
    });
  }

  private persistAuth(user: User, accessToken?: string, refreshToken?: string, expiresIn?: number): void {
    localStorage.setItem('user', JSON.stringify(user));
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (expiresIn != null) localStorage.setItem('expiresIn', String(expiresIn));
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private loadProfileByEmail(email: string): Observable<User> {
    if (!email) return throwError(() => new Error('Missing email'));
    return from(
      this.supabase.client
        .from('users')
        .select('*')
        .is('deleted_at', null)
        .eq('email', email)
        .single()
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        if (data) {
          await this.supabase.client
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);
          return this.mapDbUser(data);
        }

        const org = await this.supabase.client
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        if (org.error || !org.data?.id) {
          throw org.error || new Error('No organization available');
        }

        const [firstName, lastName] = email.split('@')[0].split('.');
        const insert = await this.supabase.client
          .from('users')
          .insert({
            first_name: firstName || 'User',
            last_name: lastName || 'Supabase',
            email,
            password_hash: 'supabase-auth',
            role: 'physician',
            organization_id: org.data.id,
            is_active: true,
            last_login: new Date().toISOString(),
          })
          .select('*')
          .single();
        if (insert.error || !insert.data) {
          throw insert.error || new Error('Failed to provision user profile');
        }
        return this.mapDbUser(insert.data);
      }),
      catchError((err) => throwError(() => err?.message || 'Failed to load profile'))
    );
  }

  private mapDbUser(row: any): User {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      specialtyId: row.specialty_id || undefined,
      organizationId: row.organization_id,
      isActive: row.is_active,
      lastLogin: row.last_login || undefined,
      createdAt: row.created_at || undefined,
    };
  }
}
