import { ReactNode, ComponentType } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  hint,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-surface flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <p className="font-semibold text-text">{title}</p>
      {hint && <p className="text-sm text-text-muted mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
