export function PageSkeleton({ rows = 5, hasHeader = true }: { rows?: number; hasHeader?: boolean }) {
  return (
    <div className="animate-pulse space-y-6">
      {hasHeader && (
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-slate-200" />
          <div className="h-4 w-80 rounded-lg bg-slate-100" />
        </div>
      )}

      {/* Toolbar row */}
      <div className="flex items-center gap-3">
        <div className="h-9 flex-1 max-w-xs rounded-xl bg-slate-100" />
        <div className="h-9 w-28 rounded-xl bg-slate-100" />
      </div>

      {/* Table / list rows */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {/* thead */}
        <div className="flex gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
          {[40, 28, 20, 12].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-slate-200`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-slate-50 px-5 py-3.5 last:border-0"
            style={{ opacity: 1 - i * 0.12 }}
          >
            {[40, 28, 20, 12].map((w, j) => (
              <div key={j} className="h-3.5 rounded-lg bg-slate-100" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
