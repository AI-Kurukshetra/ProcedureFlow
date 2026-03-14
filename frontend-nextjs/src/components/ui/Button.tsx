import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none';

const variants: Record<string, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500 shadow-[0_1px_3px_rgba(99,102,241,0.3),0_2px_8px_rgba(99,102,241,0.2)]',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-indigo-300 shadow-sm',
  ghost:
    'bg-transparent text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 focus-visible:ring-indigo-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-[0_1px_3px_rgba(239,68,68,0.3),0_2px_8px_rgba(239,68,68,0.2)]',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
