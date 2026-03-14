'use client';

import { useEffect, useRef, useState, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Select({ className, children, value, onChange, disabled, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse options from children (<option> elements)
  const options: { value: string; label: string; disabled?: boolean }[] = [];
  const parseChildren = (nodes: React.ReactNode) => {
    import('react').then(({ Children, isValidElement }) => {}); // type hint only
  };

  // We still render a hidden native select for form compatibility,
  // and build the visual layer on top.
  const nativeRef = useRef<HTMLSelectElement>(null);

  // Collect option data from the rendered select after mount
  const [optionList, setOptionList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!nativeRef.current) return;
    const opts = Array.from(nativeRef.current.options).map((o) => ({
      value: o.value,
      label: o.text,
    }));
    setOptionList(opts);
  }, [children]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = optionList.find((o) => o.value === String(value ?? ''))?.label ?? optionList[0]?.label ?? '';

  const handleSelect = (val: string) => {
    if (!nativeRef.current || disabled) return;
    // Simulate a native change event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    nativeInputValueSetter?.call(nativeRef.current, val);
    nativeRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    setOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={ref}>
      {/* Hidden native select for form/onChange compatibility */}
      <select
        ref={nativeRef}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        {...props}
      >
        {children}
      </select>

      {/* Custom trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition duration-150',
          open ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span className={cn('truncate', !value && 'text-slate-400')}>{selectedLabel}</span>
        <svg
          className={cn('ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(99,102,241,0.14),0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="max-h-56 overflow-y-auto py-1">
            {optionList.map((opt) => {
              const isSelected = String(value ?? '') === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors duration-100',
                    isSelected
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!isSelected && <span className="h-3.5 w-3.5 shrink-0" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
