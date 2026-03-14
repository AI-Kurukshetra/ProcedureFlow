'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
    } else {
      window.location.href = '/';
    }
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Check your email for confirmation.');
    }
  };

  return (
    <div className="min-h-screen bg-app px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient shadow-[0_4px_16px_rgba(99,102,241,0.35)]">
            <span className="text-xl font-bold text-white">PF</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ProcedureFlow</h1>
          <p className="text-sm text-slate-500">Clinical workflow intelligence platform</p>
        </div>
        <Card>
          <CardHeader title="Welcome back" subtitle="Sign in to access the clinical workspace." />
          <div className="grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Email
              <Input className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password
              <Input className="mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={signIn}>Sign in</Button>
              <Button variant="secondary" onClick={signUp}>Create account</Button>
            </div>
            <button
              className="text-left text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition"
              onClick={() => (window.location.href = '/reset')}
            >
              Forgot password?
            </button>
            {status ? <p className="text-sm text-slate-500">{status}</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
