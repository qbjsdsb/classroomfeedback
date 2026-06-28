import { ComponentType } from "react";

export function StatCard({ label, value, unit, icon: Icon }: {
  label: string;
  value: number;
  unit?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-text-muted truncate">{label}</p>
          <p className="text-2xl font-bold text-text mt-1">
            {value}
            {unit && <span className="text-xs font-normal text-text-muted ml-1">{unit}</span>}
          </p>
        </div>
        <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-surface flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
