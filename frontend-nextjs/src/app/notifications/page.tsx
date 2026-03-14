'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const typeTone: Record<string, 'emerald' | 'amber' | 'rose' | 'slate' | 'sky'> = {
  alert: 'rose',
  warning: 'amber',
  info: 'sky',
  success: 'emerald',
  reminder: 'slate',
  system: 'slate',
};

const typeLabel: Record<string, string> = {
  alert: 'Alert',
  warning: 'Warning',
  info: 'Info',
  success: 'Success',
  reminder: 'Reminder',
  system: 'System',
};

export default function NotificationsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingRead, setMarkingRead] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    setMarkingRead(true);
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);
    await load();
    setMarkingRead(false);
  };

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayed = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  if (loading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <>
        <SectionHeader
          title="Notifications"
          description="Alerts, reminders, clinical warnings, and system updates from across the ProcedureFlow platform."
          action={
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  {unreadCount} unread
                </span>
              )}
              <Button
                variant="secondary"
                onClick={() => setFilter((prev) => (prev === 'all' ? 'unread' : 'all'))}
              >
                {filter === 'all' ? 'Show unread only' : 'Show all'}
              </Button>
              {unreadCount > 0 && (
                <Button onClick={markAllRead} disabled={markingRead}>
                  {markingRead ? 'Marking...' : 'Mark all read'}
                </Button>
              )}
            </div>
          }
        />

        <Card>
          <CardHeader
            title={filter === 'unread' ? 'Unread Notifications' : 'All Notifications'}
            subtitle={`${displayed.length} notification${displayed.length !== 1 ? 's' : ''}`}
          />
          <div className="space-y-2">
            {displayed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                {filter === 'unread' ? 'All caught up — no unread notifications.' : 'No notifications yet.'}
              </div>
            ) : (
              displayed.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                    n.is_read ? 'border-slate-100 bg-white' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.type && (
                        <Badge
                          label={typeLabel[n.type] ?? n.type}
                          tone={typeTone[n.type] ?? 'slate'}
                        />
                      )}
                      <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-rose-400" title="Unread" />
                      )}
                    </div>
                    {n.message && (
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{n.message}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : '—'}
                      {n.is_read && n.read_at ? ` · Read ${new Date(n.read_at).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!n.is_read && (
                      <button
                        onClick={() => markOneRead(n.id)}
                        className="rounded-xl px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="rounded-xl px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </>
    </AppShell>
  );
}
