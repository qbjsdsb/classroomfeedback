import { clsx } from "clsx";
import type { ThemeName } from "../hooks/useTheme";

export interface ThemeMeta {
  name: ThemeName;
  label: string;
  primary: string;  // hex 色值，用于色块展示
}

export const THEMES: ThemeMeta[] = [
  { name: "warm", label: "温暖棕", primary: "#7a5c3e" },
  { name: "blue", label: "知性蓝", primary: "#2563eb" },
  { name: "green", label: "自然绿", primary: "#166534" },
  { name: "purple", label: "典雅紫", primary: "#7e57c2" },
];

export function ThemeCard({
  meta,
  active,
  onClick,
}: {
  meta: ThemeMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("theme-card", active && "theme-card-active")}
      aria-pressed={active}
    >
      <span
        className="theme-card-swatch"
        style={{ background: meta.primary }}
      />
      <span className="theme-card-label">{meta.label}</span>
    </button>
  );
}
