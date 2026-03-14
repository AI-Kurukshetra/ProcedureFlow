import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition duration-200',
        'placeholder:text-slate-400',
        'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
        'hover:border-slate-300',
        className
      )}
      {...props}
    />
  );
}
