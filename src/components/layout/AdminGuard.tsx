'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export function AdminGuard({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (!email) {
        setAuthorized(false);
        return;
      }
      const { data: profile } = await supabase.from('users').select('role').eq('email', email).single();
      setAuthorized(profile?.role === 'admin');
    };
    check();
  }, []);

  if (authorized === null) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Checking access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p className="text-base font-semibold text-slate-800">Admin Access Required</p>
        <p className="mt-2">You do not have permission to view this page.</p>
        <Button className="mt-4" variant="secondary" onClick={() => (window.location.href = '/')}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
