'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const QUEUE_KEY = 'procedureflow_offline_queue';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setOffline(!navigator.onLine);
      try {
        const stored = localStorage.getItem(QUEUE_KEY);
        setQueueCount(stored ? JSON.parse(stored).length : 0);
      } catch {
        setQueueCount(0);
      }
    };

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    // Refresh queue count whenever localStorage might change
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(QUEUE_KEY);
        setQueueCount(stored ? JSON.parse(stored).length : 0);
      } catch {
        setQueueCount(0);
      }
    }, 3000);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      clearInterval(interval);
    };
  }, []);

  if (!offline && queueCount === 0) return null;

  if (!offline && queueCount > 0) {
    // Back online but drafts still pending
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span>
          Back online — <strong>{queueCount} offline draft{queueCount !== 1 ? 's' : ''}</strong> ready to sync.
        </span>
        <Link href="/offline" className="ml-4 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300">
          Sync now →
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>
        You are offline.{' '}
        {queueCount > 0
          ? `${queueCount} draft${queueCount !== 1 ? 's' : ''} queued — will sync when reconnected.`
          : 'Changes will sync once you are back online.'}
      </span>
      <Link href="/offline" className="ml-4 rounded-full bg-rose-200 px-3 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-300">
        Offline hub →
      </Link>
    </div>
  );
}
