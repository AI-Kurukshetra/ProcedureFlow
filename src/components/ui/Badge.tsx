import { cn } from '@/lib/utils';

export function Badge({
  label,
  tone = 'slate',
}: {
  label: string;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'violet' | 'pink';
}) {
  const tones: Record<string, string> = {
    slate:   'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber:   'bg-amber-100 text-amber-700',
    rose:    'bg-rose-100 text-rose-700',
    sky:     'bg-sky-100 text-sky-700',
    indigo:  'bg-indigo-100 text-indigo-700',
    violet:  'bg-violet-100 text-violet-700',
    pink:    'bg-pink-100 text-pink-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>
      {label}
    </span>
  );
}
