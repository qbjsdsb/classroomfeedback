export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-surface-2 rounded animate-pulse mb-2 ${i === lines - 1 ? "w-4/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
