'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const QUEUE_KEY = 'procedureflow_offline_queue';

type DraftItem = {
  id: number;
  title: string;
  notes: string;
  findings: string;
  status: string;
  created_at: string;
  synced?: boolean;
};

export default function OfflinePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [queue, setQueue] = useState<DraftItem[]>([]);
  const [form, setForm] = useState({ title: '', notes: '', findings: '', status: 'draft' });
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSyncPending, setAutoSyncPending] = useState(false);

  const loadQueue = () => {
    const stored = localStorage.getItem(QUEUE_KEY);
    setQueue(stored ? JSON.parse(stored) : []);
  };

  const saveQueue = (next: DraftItem[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    setQueue(next);
  };

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setAutoSyncPending(true);
    };
    const handleOffline = () => {
      setOnline(false);
      setAutoSyncPending(false);
    };

    setOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadQueue();
    setLoading(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!autoSyncPending || !online) return;
    const stored = localStorage.getItem(QUEUE_KEY);
    const pendingItems = stored ? JSON.parse(stored) : [];
    if (pendingItems.length === 0) {
      setAutoSyncPending(false);
      return;
    }
    setStatus(`Back online — syncing ${pendingItems.length} offline draft(s)...`);
    syncQueue().then(() => setAutoSyncPending(false));
  }, [autoSyncPending, online]);

  const saveOffline = () => {
    if (!form.title.trim()) {
      setStatus('Procedure title is required.');
      return;
    }
    const next: DraftItem[] = [
      ...queue,
      {
        id: Date.now(),
        title: form.title,
        notes: form.notes,
        findings: form.findings,
        status: form.status,
        created_at: new Date().toISOString(),
      },
    ];
    saveQueue(next);
    setForm({ title: '', notes: '', findings: '', status: 'draft' });
    setStatus('Draft saved offline.');
  };

  const deleteDraft = (id: number) => {
    const next = queue.filter((item) => item.id !== id);
    saveQueue(next);
    setStatus('Draft removed from queue.');
  };

  const syncQueue = async () => {
    if (!online) {
      setStatus('You are offline. Connect to internet to sync.');
      return;
    }
    const currentQueue: DraftItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    if (currentQueue.length === 0) {
      setStatus('Nothing to sync.');
      return;
    }
    setSyncing(true);
    let successCount = 0;
    let failCount = 0;
    for (const item of currentQueue) {
      const { error } = await supabase.from('procedures').insert({
        title: item.title,
        notes: item.notes,
        findings: item.findings || null,
        status: item.status ?? 'draft',
        procedure_date: new Date().toISOString().slice(0, 10),
      });
      if (error) {
        failCount += 1;
      } else {
        successCount += 1;
      }
    }
    if (failCount === 0) {
      localStorage.removeItem(QUEUE_KEY);
      setQueue([]);
      setStatus(`Synced ${successCount} draft(s) to database successfully.`);
    } else {
      // Keep failed items in queue
      setStatus(`${successCount} synced, ${failCount} failed. Failed items remain in queue.`);
    }
    setSyncing(false);
  };

  const pendingCount = queue.length;

  if (loading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <>
        <SectionHeader
          title="Offline Mode Capability"
          description="Continue documentation when internet is unavailable. Drafts are stored locally and automatically synced to the database when connectivity is restored."
          action={
            <div className="flex items-center gap-3">
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {online ? 'Online' : 'Offline'}
              </div>
              {pendingCount > 0 && (
                <Badge label={`${pendingCount} pending`} tone={online ? 'amber' : 'rose'} />
              )}
              <Button variant="secondary" onClick={syncQueue} disabled={!online || syncing || pendingCount === 0}>
                {syncing ? 'Syncing...' : `Sync Now${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Draft Form */}
          <Card>
            <CardHeader
              title="Create Offline Draft"
              subtitle="Fill in procedure details to save locally without internet."
            />
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600">
                Procedure title *
                <Input
                  className="mt-2"
                  placeholder="e.g. Colonoscopy – Room 3"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Initial status
                <Select
                  className="mt-2"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="in-progress">In progress</option>
                </Select>
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Notes
                <Textarea
                  className="mt-2"
                  placeholder="Procedure notes, context, or observations"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Preliminary findings
                <Textarea
                  className="mt-2"
                  placeholder="Initial clinical findings (can be updated after sync)"
                  value={form.findings}
                  onChange={(e) => setForm({ ...form, findings: e.target.value })}
                />
              </label>
              <Button onClick={saveOffline}>Save offline draft</Button>
              {status ? (
                <p className={`text-sm ${status.includes('error') || status.includes('Error') || status.includes('failed') ? 'text-rose-600' : 'text-slate-500'}`}>
                  {status}
                </p>
              ) : null}
            </div>
          </Card>

          {/* Queue */}
          <Card>
            <CardHeader
              title="Pending Sync Queue"
              subtitle={
                pendingCount === 0
                  ? 'All drafts synced.'
                  : `${pendingCount} draft${pendingCount !== 1 ? 's' : ''} waiting to sync`
              }
            />
            {pendingCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No offline drafts. Queue is empty.
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                      {item.notes && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.notes}</p>
                      )}
                      <Badge label={item.status} tone={item.status === 'in-progress' ? 'amber' : 'slate'} />
                    </div>
                    <button
                      onClick={() => deleteDraft(item.id)}
                      className="mt-1 shrink-0 rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {syncing && (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Sync in progress — uploading drafts to database…
              </div>
            )}
            {!online && pendingCount > 0 && (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                You are offline. Drafts will automatically sync when your connection is restored.
              </div>
            )}
          </Card>
        </div>
      </>
    </AppShell>
  );
}
