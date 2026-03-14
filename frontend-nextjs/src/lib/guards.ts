import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function ensureProfile(email: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from('users').select('*').eq('email', email).single();
  if (existing) return existing;

  const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
  const fallbackName = email.split('@')[0] ?? 'user';
  const payload = {
    email,
    first_name: fallbackName,
    last_name: 'User',
    role: 'nurse',
    organization_id: org?.id ?? null,
  };
  const { data: created } = await supabase.from('users').insert(payload).select('*').single();
  return created;
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const profile = await ensureProfile(user.email);
  if (profile?.role !== 'admin') {
    redirect('/');
  }
}

export async function requireRole(role: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const profile = await ensureProfile(user.email);
  if (profile?.role !== role) {
    redirect('/');
  }
}

export async function requireAnyRole(roles: string[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const profile = await ensureProfile(user.email);
  if (!profile?.role || !roles.includes(profile.role)) {
    redirect('/');
  }
}
