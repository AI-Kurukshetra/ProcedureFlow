'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function ProfilePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (email) {
        const [profileRes, orgRes] = await Promise.all([
          supabase.from('users').select('*').eq('email', email).single(),
          supabase.from('organizations').select('*').order('name', { ascending: true }),
        ]);
        setProfile(profileRes.data ?? null);
        setOrganizations(orgRes.data ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        organization_id: profile.organization_id,
      })
      .eq('id', profile.id);
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Profile updated.');
    }
    setSaving(false);
  };

  if (loading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <SectionHeader title="Profile" description="Manage your account profile and organization." />
      <Card>
        <CardHeader title="Account Details" />
        {profile ? (
          <div className="grid gap-4">
            <label className="text-sm font-medium text-slate-600">
              First name
              <Input
                className="mt-2"
                value={profile.first_name ?? ''}
                onChange={(event) => setProfile({ ...profile, first_name: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Last name
              <Input
                className="mt-2"
                value={profile.last_name ?? ''}
                onChange={(event) => setProfile({ ...profile, last_name: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Organization
              <Select
                className="mt-2"
                value={profile.organization_id ?? ''}
                onChange={(event) => setProfile({ ...profile, organization_id: event.target.value })}
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex gap-3">
              <Button onClick={updateProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              {status ? <p className="text-sm text-slate-500">{status}</p> : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Profile not available.</p>
        )}
      </Card>
    </AppShell>
  );
}
