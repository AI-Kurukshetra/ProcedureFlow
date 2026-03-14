'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Entry = { id: string; key: string; value: string };

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function toEntries(value: Record<string, any>) {
  return Object.entries(value ?? {}).map(([key, val]) => ({
    id: makeId(),
    key,
    value: typeof val === 'string' ? val : JSON.stringify(val),
  }));
}

function looksStructured(raw: string) {
  const t = raw.trim();
  if (!t) return false;
  if (t.startsWith('{') || t.startsWith('[') || t.startsWith('"')) return true;
  if (t === 'true' || t === 'false' || t === 'null') return true;
  if (/^-?\\d+(\\.\\d+)?$/.test(t)) return true;
  return false;
}

function toObject(entries: Entry[]) {
  const payload: Record<string, any> = {};
  entries.forEach((entry) => {
    if (!entry.key.trim()) return;
    const raw = entry.value;
    // Try to preserve JSON/number/boolean types when user enters structured values
    if (looksStructured(raw)) {
      try {
        payload[entry.key] = JSON.parse(raw);
        return;
      } catch {
        /* fall through to plain string */
      }
    }
    payload[entry.key] = raw;
  });
  return payload;
}

export function KeyValueEditor({
  value,
  onChange,
}: {
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>(toEntries(value));
   // track last value we emitted to avoid stomping in-progress edits
  const lastEmitted = useRef<string>(JSON.stringify(value ?? {}));

  useEffect(() => {
    const serialized = JSON.stringify(value ?? {});
    if (serialized !== lastEmitted.current) {
      setEntries(toEntries(value));
      lastEmitted.current = serialized;
    }
  }, [value]);

  const update = (next: Entry[]) => {
    setEntries(next);
    const nextObj = toObject(next);
    lastEmitted.current = JSON.stringify(nextObj);
    onChange(nextObj);
  };

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">No fields yet. Add one below.</p>
      ) : null}
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex flex-wrap gap-2">
          <Input
            className="flex-1"
            placeholder="Key"
            value={entry.key}
            onChange={(event) => {
              const next = [...entries];
              next[index] = { ...next[index], key: event.target.value };
              update(next);
            }}
          />
          <Input
            className="flex-[2]"
            placeholder="Value"
            value={entry.value}
            onChange={(event) => {
              const next = [...entries];
              next[index] = { ...next[index], value: event.target.value };
              update(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-3 text-xs"
            onClick={() => {
              const next = entries.filter((_, idx) => idx !== index);
              update(next);
            }}
          >
            <svg
              className="h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="h-10 px-4 text-sm font-semibold"
        onClick={() => update([...entries, { id: makeId(), key: '', value: '' }])}
      >
        Add field
      </Button>
    </div>
  );
}
