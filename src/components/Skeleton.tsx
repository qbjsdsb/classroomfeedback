export function Skeleton({ lines = 3, avatar = false }: { lines?: number; avatar?: boolean }) {
  return (
    <div className="card space-y-3">
      {avatar && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 skeleton-shimmer rounded" />
            <div className="h-3 w-1/4 skeleton-shimmer rounded" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 skeleton-shimmer rounded ${i === lines - 1 ? "w-4/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
