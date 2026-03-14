import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white bg-white p-6',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(99,102,241,0.07)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
