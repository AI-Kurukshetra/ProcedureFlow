import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(99,102,241,0.06)]', className)}>
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-100 bg-slate-50/70">
      {children}
    </thead>
  );
}

export function TRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-slate-50 transition-colors duration-100 last:border-0 hover:bg-indigo-50/40">
      {children}
    </tr>
  );
}

export function TCell({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={cn('px-5 py-3.5 text-slate-700', className)}>{children}</td>;
}

export function THeadCell({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400',
        onClick && 'cursor-pointer select-none hover:text-indigo-500',
        className
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
