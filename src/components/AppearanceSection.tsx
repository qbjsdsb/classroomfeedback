import { clsx } from "clsx";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Mode } from "../hooks/useTheme";
import { ThemeCard, THEMES } from "./ThemeCard";

const MODE_OPTIONS: { value: Mode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

export function AppearanceSection() {
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <div className="card space-y-5">
      <h2 className="section-title">外观</h2>

      <div className="form-field">
        <span className="label">主题</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map(meta => (
            <ThemeCard
              key={meta.name}
              meta={meta}
              active={theme === meta.name}
              onClick={() => setTheme(meta.name)}
            />
          ))}
        </div>
      </div>

      <div className="form-field">
        <span className="label">明暗模式</span>
        <div className="flex gap-2">
          {MODE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={clsx("mode-btn", mode === opt.value && "mode-btn-active")}
              >
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
