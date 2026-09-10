export function Spinner({ className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-teach ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

// Skeleton card used while skill listings load.
export function SkillCardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="mb-3 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-2 h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-4 h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-6 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
