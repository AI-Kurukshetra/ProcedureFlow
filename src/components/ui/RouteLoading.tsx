export function RouteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex flex-col items-center gap-3 text-slate-500" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
}
