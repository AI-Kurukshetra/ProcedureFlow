import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default async function RolesTestPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;
  if (user?.email) {
    const { data } = await supabase.from('users').select('*').eq('email', user.email).single();
    profile = data ?? null;
  }

  return (
    <AppShell>
      <SectionHeader title="Role Test" description="Quickly verify your role and organization binding." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Auth Session" />
          {user ? (
            <div className="text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-semibold text-slate-800">User ID:</span> {user.id}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No active session.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Profile Role" />
          {profile ? (
            <div className="text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Role:</span> {profile.role ?? 'n/a'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Organization ID:</span> {profile.organization_id ?? 'n/a'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No profile found for this user.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
