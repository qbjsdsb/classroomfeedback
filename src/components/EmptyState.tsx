import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center py-8 text-center">
      <Inbox className="w-10 h-10 mb-2 text-text-muted opacity-40" />
      <p className="font-semibold text-text">{title}</p>
      {hint && <p className="text-sm text-text-muted mt-1">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
