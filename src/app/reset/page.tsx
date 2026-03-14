'use client';

import { useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    return null;
  };

  const sendReset = async () => {
    const validationError = validate();
    if (validationError) {
      setStatus(validationError);
      setIsError(true);
      return;
    }
    setSending(true);
    setStatus('');
    setIsError(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setStatus(error.message);
      setIsError(true);
    } else {
      setSent(true);
      setStatus('Password reset email sent. Check your inbox.');
      setIsError(false);
    }
    setSending(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendReset();
  };

  return (
    <div className="min-h-screen bg-app px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader title="Reset Password" subtitle="Enter your email to receive a reset link." />
          {sent ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
              <p className="text-sm text-slate-500">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  className="font-semibold text-slate-700 underline hover:text-slate-900"
                  onClick={() => { setSent(false); setStatus(''); }}
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                Email address
                <Input
                  className="mt-2"
                  type="email"
                  placeholder="you@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoFocus
                />
              </label>
              <Button onClick={sendReset} disabled={sending}>
                {sending ? 'Sending…' : 'Send reset link'}
              </Button>
              {status && (
                <p className={`text-sm ${isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {status}
                </p>
              )}
            </div>
          )}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
              ← Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
