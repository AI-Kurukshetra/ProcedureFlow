'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Topbar() {
  const [offline, setOffline] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const quickCreateRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = () => setOffline(!navigator.onLine);
    handler();
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);

    const loadProfile = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const email = session?.user?.email ?? null;
      setUserEmail(email);

      if (session?.expires_at) {
        const remaining = session.expires_at * 1000 - Date.now();
        setSessionWarning(remaining > 0 && remaining < 5 * 60 * 1000 ? 'Session expires soon' : null);
      }

      if (email) {
        const { data: profile } = await supabase.from('users').select('*').eq('email', email).single();
        setUserRole(profile?.role ?? null);
        if (profile?.organization_id) {
          const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
          setOrgName(org?.name ?? null);
        } else {
          setOrgName(null);
        }
      } else {
        setUserRole(null);
        setOrgName(null);
      }
      setLoading(false);
    };

    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/login';
      } else {
        loadProfile();
      }
    });

    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'PF';

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!search.trim()) return;
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200/60 bg-white px-6 shadow-sm">
      {/* Search */}
      <form onSubmit={submitSearch} className="hidden w-full max-w-sm items-center gap-2 md:flex">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          <Input
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
            placeholder="Search patients, procedures…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" className="shrink-0">Search</Button>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Status */}
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          offline ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${offline ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {offline ? 'Offline' : 'Online'}
        </div>

        {sessionWarning && (
          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            {sessionWarning}
          </div>
        )}

        {/* Quick create */}
        <div className="relative" ref={quickCreateRef}>
          <Button
            variant="primary"
            className="gap-1.5 text-xs px-3 py-1.5"
            onClick={() => setQuickCreateOpen((p) => !p)}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </Button>
          {quickCreateOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_32px_rgba(99,102,241,0.18)] z-50">
              {[
                { label: 'New Procedure', href: '/procedures', icon: '📋' },
                { label: 'New Patient', href: '/patients', icon: '👤' },
                { label: 'New Template', href: '/templates', icon: '📄' },
                { label: 'New Schedule', href: '/scheduling', icon: '📅' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setQuickCreateOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Link>

        {/* Profile — skeleton while session loads */}
        {loading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-24 rounded-xl bg-slate-100" />
            <div className="h-8 w-8 rounded-xl bg-slate-100" />
          </div>
        ) : userEmail ? (
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-slate-50"
              onClick={() => setProfileMenuOpen((p) => !p)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-gradient text-xs font-bold text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]">
                {initials}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-xs font-semibold text-slate-800 leading-tight capitalize">{userEmail.split('@')[0]}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{orgName ?? (userRole ?? 'user')}</span>
              </div>
              <svg className="hidden h-3 w-3 text-slate-400 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_32px_rgba(99,102,241,0.18)] z-50">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View profile
                </Link>
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                  onClick={onSignOut}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="primary" onClick={() => (window.location.href = '/login')}>Sign in</Button>
        )}
      </div>
    </header>
  );
}
