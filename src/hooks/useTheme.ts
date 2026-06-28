import { useState, useEffect, useCallback } from "react";

export type ThemeName = "warm" | "blue" | "green" | "purple";
export type Mode = "light" | "dark" | "system";
type ResolvedMode = "light" | "dark";

const THEME_KEY = "cf-theme";
const MODE_KEY = "cf-mode";
const LEGACY_KEY = "theme";

function migrate(): void {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === "light" || legacy === "dark") {
    if (!localStorage.getItem(MODE_KEY)) {
      localStorage.setItem(MODE_KEY, legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
  }
}

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "warm";
  migrate();
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "warm" || saved === "blue" || saved === "green" || saved === "purple") return saved;
  return "warm";
}

function getInitialMode(): Mode {
  if (typeof window === "undefined") return "system";
  migrate();
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

function resolveMode(mode: Mode): ResolvedMode {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [mode, setModeState] = useState<Mode>(getInitialMode);
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() => resolveMode(getInitialMode()));

  // 应用 theme 到 data-theme 属性
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // 应用 mode：解析 + 应用 dark class + 监听系统变化
  useEffect(() => {
    const apply = (rm: ResolvedMode) => {
      setResolvedMode(rm);
      const root = document.documentElement;
      if (rm === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    };

    if (mode !== "system") {
      apply(mode);
      return;
    }

    // system 模式：监听 matchMedia 变化
    apply(resolveMode("system"));
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  // 持久化 mode（非 system 时）
  useEffect(() => {
    if (mode !== "system") {
      localStorage.setItem(MODE_KEY, mode);
    } else {
      localStorage.setItem(MODE_KEY, "system");
    }
  }, [mode]);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);
  const setMode = useCallback((m: Mode) => setModeState(m), []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const prevResolved = resolveMode(prev);
      return prevResolved === "dark" ? "light" : "dark";
    });
  }, []);

  return { theme, mode, resolvedMode, setTheme, setMode, toggleMode };
}
