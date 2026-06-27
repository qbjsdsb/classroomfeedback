import { ReactNode } from "react";

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center py-8 text-center">
      <div className="text-3xl mb-2 opacity-40">📭</div>
      <p className="font-semibold text-gray-700">{title}</p>
      {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
