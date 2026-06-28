# 主题系统重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入 4 预设主题（温暖棕/知性蓝/自然绿/典雅紫）+ 明暗独立切换（浅色/深色/跟随系统）+ 衬线标题 + 主色 tint 阴影 + ClassFlow 品牌识别，让 UI 从"冷淡后台感"变为"有温度的教育产品"。

**Architecture:** CSS 变量 + `data-theme` 属性驱动（零运行时开销）；`useTheme` hook 升级为双维度（theme + mode）；老用户旧 `theme` key 自动迁移到 `cf-mode`；设置页新增外观区块；导航栏 ThemeToggle 只切明暗。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind 3.4 + clsx + lucide-react（已装）。

---

## File Structure

| 文件 | 责任 | 操作 |
|---|---|---|
| `src/index.css` | 4 主题 × 2 明暗 CSS 变量 + 排版/圆角/阴影组件层 | 整体替换 |
| `index.html` | 无 FOUC inline script（迁移 + data-theme + dark class） | 修改 |
| `src/hooks/useTheme.ts` | 4 主题 + 3 明暗 + 迁移 + system 监听 | 整体替换 |
| `tests/hooks/useTheme.test.ts` | useTheme 升级测试 | 整体替换 |
| `src/components/ThemeCard.tsx` | 主题色卡组件 | 新建 |
| `src/components/AppearanceSection.tsx` | 设置页外观区块（主题 + 明暗） | 新建 |
| `src/pages/SettingsPage.tsx` | 嵌入 AppearanceSection | 修改 |
| `src/App.tsx` | ThemeToggle 改造 + 品牌名 + hero eyebrow | 修改 |
| `src/pages/HomePage.tsx` | hero 加 eyebrow + ClassFlow 文案 | 修改 |

---

### Task 1: CSS 变量层（4 主题 × 2 明暗 + 排版/圆角/阴影）

**Files:**
- Modify: `src/index.css`（整体替换）

- [ ] **Step 1: 整体替换 src/index.css**

把 `src/index.css` 整体替换为：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
  }

  /* ============ 主题 1：温暖棕 warm ============ */
  [data-theme="warm"] {
    --bg: 250 247 242;
    --surface: 255 250 243;
    --surface-2: 243 233 216;
    --border: 236 229 216;
    --text: 61 44 30;
    --text-muted: 138 122 102;
    --primary: 122 92 62;
    --primary-hover: 160 125 86;
    --primary-surface: 243 233 216;
  }
  [data-theme="warm"].dark {
    --bg: 28 22 18;
    --surface: 42 33 26;
    --surface-2: 58 46 36;
    --border: 74 58 46;
    --text: 240 232 220;
    --text-muted: 184 168 148;
    --primary: 200 150 100;
    --primary-hover: 220 175 125;
    --primary-surface: 74 54 38;
  }

  /* ============ 主题 2：知性蓝 blue ============ */
  [data-theme="blue"] {
    --bg: 248 250 252;
    --surface: 255 255 255;
    --surface-2: 241 245 249;
    --border: 226 232 240;
    --text: 30 41 59;
    --text-muted: 100 116 139;
    --primary: 37 99 235;
    --primary-hover: 29 78 216;
    --primary-surface: 219 234 254;
  }
  [data-theme="blue"].dark {
    --bg: 15 23 42;
    --surface: 30 41 59;
    --surface-2: 51 65 85;
    --border: 51 65 85;
    --text: 226 232 240;
    --text-muted: 148 163 184;
    --primary: 96 165 250;
    --primary-hover: 147 197 253;
    --primary-surface: 30 58 138;
  }

  /* ============ 主题 3：自然绿 green ============ */
  [data-theme="green"] {
    --bg: 247 250 247;
    --surface: 255 255 255;
    --surface-2: 237 242 237;
    --border: 223 231 223;
    --text: 30 41 30;
    --text-muted: 100 116 100;
    --primary: 22 101 52;
    --primary-hover: 21 128 61;
    --primary-surface: 220 237 226;
  }
  [data-theme="green"].dark {
    --bg: 18 28 18;
    --surface: 30 41 30;
    --surface-2: 51 65 51;
    --border: 51 65 51;
    --text: 226 232 226;
    --text-muted: 148 163 148;
    --primary: 134 200 150;
    --primary-hover: 170 220 180;
    --primary-surface: 30 58 38;
  }

  /* ============ 主题 4：典雅紫 purple ============ */
  [data-theme="purple"] {
    --bg: 250 248 252;
    --surface: 255 255 255;
    --surface-2: 243 240 248;
    --border: 229 224 238;
    --text: 41 30 61;
    --text-muted: 116 100 139;
    --primary: 126 87 194;
    --primary-hover: 107 70 193;
    --primary-surface: 237 228 252;
  }
  [data-theme="purple"].dark {
    --bg: 23 18 32;
    --surface: 36 28 51;
    --surface-2: 58 46 78;
    --border: 58 46 78;
    --text: 232 226 240;
    --text-muted: 168 156 184;
    --primary: 196 165 240;
    --primary-hover: 214 190 250;
    --primary-surface: 58 38 88;
  }

  body {
    font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei",
      -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-feature-settings: "tnum";
    @apply bg-bg text-text antialiased;
  }

  /* 标题用衬线感，带书卷气 */
  h1, .h1, .page-title {
    font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC",
      "PingFang SC", serif;
    letter-spacing: -0.2px;
  }
}

@layer components {
  /* 页面骨架 */
  .page-header {
    @apply flex items-center justify-between gap-2 mb-5;
  }
  .section-title {
    @apply text-base font-semibold text-text;
  }

  /* 卡片层次 */
  .card {
    @apply bg-surface border border-border p-5;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgb(var(--primary) / 0.04),
                0 4px 12px -4px rgb(var(--primary) / 0.08);
  }
  .card-hover {
    @apply transition;
  }
  .card-hover:hover {
    border-color: rgb(var(--primary) / 0.4);
    box-shadow: 0 2px 4px rgb(var(--primary) / 0.06),
                0 8px 24px -6px rgb(var(--primary) / 0.12);
  }
  .card-accent {
    @apply card border-l-4;
    border-left-color: rgb(var(--primary));
  }

  /* 按钮基础 */
  .btn {
    @apply inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed;
    border-radius: 8px;
  }
  .btn-primary {
    @apply btn text-white;
    background: rgb(var(--primary));
    box-shadow: 0 1px 2px rgb(var(--primary) / 0.3);
  }
  .btn-primary:hover {
    background: rgb(var(--primary-hover));
    box-shadow: 0 2px 6px rgb(var(--primary) / 0.4);
  }
  .btn-primary:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgb(var(--primary) / 0.2);
  }
  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700;
  }
  .btn-ghost {
    @apply btn;
    color: rgb(var(--primary));
  }
  .btn-ghost:hover {
    background: rgb(var(--primary-surface));
  }
  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700;
  }
  .btn-soft {
    @apply btn text-text;
    background: rgb(var(--surface-2));
  }
  .btn-soft:hover {
    background: rgb(var(--border));
  }

  /* 表单元素 */
  .form-field {
    @apply space-y-1;
  }
  .input {
    @apply block w-full border px-3 py-2 text-sm bg-surface text-text
      focus:outline-none focus:ring-2 focus:border-primary
      placeholder:text-text-muted;
    border-color: rgb(var(--border));
    border-radius: 8px;
    --tw-ring-color: rgb(var(--primary) / 0.4);
  }
  .input:focus {
    border-color: rgb(var(--primary));
  }
  .label {
    @apply block text-sm font-medium text-text;
  }
  .hint {
    @apply text-xs text-text-muted;
  }

  /* 导航 */
  .nav-link {
    @apply px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5;
  }
  .nav-link-active {
    @apply font-medium;
    background: rgb(var(--primary-surface));
    color: rgb(var(--primary));
  }
  .nav-link-inactive {
    @apply hover:text-text;
    color: rgb(var(--text-muted));
  }
  .nav-link-inactive:hover {
    background: rgb(var(--surface-2));
  }

  /* 主题色卡（设置页用） */
  .theme-card {
    @apply cursor-pointer transition border-2 rounded-lg p-3 flex flex-col items-center gap-2;
    border-color: rgb(var(--border));
    background: rgb(var(--surface));
  }
  .theme-card:hover {
    border-color: rgb(var(--primary) / 0.5);
  }
  .theme-card-active {
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 3px rgb(var(--primary) / 0.15);
  }
  .theme-card-swatch {
    @apply w-10 h-10 rounded-full;
  }
  .theme-card-label {
    @apply text-xs font-medium text-text;
  }

  /* 明暗模式切换按钮组 */
  .mode-btn {
    @apply px-3 py-1.5 text-sm rounded-md transition flex items-center gap-1.5;
    color: rgb(var(--text-muted));
  }
  .mode-btn:hover {
    background: rgb(var(--surface-2));
    color: rgb(var(--text));
  }
  .mode-btn-active {
    background: rgb(var(--primary-surface));
    color: rgb(var(--primary));
    @apply font-medium;
  }
}
```

注意：
- 删除了原 `:root` / `.dark` 选择器，改用 `[data-theme="x"]` / `[data-theme="x"].dark`
- 圆角：card 14px、btn/input 8px（原 8px/6px）
- 阴影用 `rgb(var(--primary) / ...)` 带主色 tint
- `.card-hover` 改为只控制 transition，hover 效果在 `:hover` 里写（避免和 `.card` 的 box-shadow 冲突）
- 间距：page-header mb-4→mb-5，card p-4→p-5
- 新增 `.theme-card*` 和 `.mode-btn*` class（设置页用）

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -8`
Expected: build 成功（Tailwind 不会因 CSS 变量报错）

- [ ] **Step 3: 跑全量测试确认无回归**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 72 tests passed（CSS 改动不影响逻辑测试，但 useTheme 测试可能因旧 key 失败——这是预期的，Task 2 会重写测试）

注意：如果 useTheme 的 4 个测试失败（因为它们用旧 `theme` key），这是预期的，Task 2 会重写。其他 68 测试应通过。

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add src/index.css && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: CSS 变量层——4 主题 × 2 明暗 + 衬线标题 + 主色 tint 阴影 + 大圆角"
```

---

### Task 2: useTheme 升级（TDD）

**Files:**
- Modify: `tests/hooks/useTheme.test.ts`（整体替换）
- Modify: `src/hooks/useTheme.ts`（整体替换）

- [ ] **Step 1: 写失败测试**

把 `tests/hooks/useTheme.test.ts` 整体替换为：

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../src/hooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
});

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("dark") && matches,
    media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
  }));
}

describe("useTheme", () => {
  it("无 localStorage 时默认 theme=warm, mode=system", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("warm");
    expect(result.current.mode).toBe("system");
    expect(result.current.resolvedMode).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("warm");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("system 模式 + 系统浅色 → resolvedMode=light", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedMode).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("setTheme 写 cf-theme 并设置 data-theme 属性", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("green"));
    expect(result.current.theme).toBe("green");
    expect(localStorage.getItem("cf-theme")).toBe("green");
    expect(document.documentElement.getAttribute("data-theme")).toBe("green");
    vi.unstubAllGlobals();
  });

  it("setMode 写 cf-mode", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    expect(result.current.mode).toBe("dark");
    expect(localStorage.getItem("cf-mode")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("setMode(system) 时 resolvedMode 跟随系统", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    expect(result.current.resolvedMode).toBe("dark");
    act(() => result.current.setMode("system"));
    expect(result.current.mode).toBe("system");
    expect(result.current.resolvedMode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("toggleMode: light → dark", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("light"));
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("dark");
    expect(result.current.resolvedMode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("toggleMode: dark → light", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("light");
    expect(result.current.resolvedMode).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("toggleMode: system(resolved=dark) → light（脱离 system）", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedMode).toBe("dark");
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("light");
    expect(result.current.resolvedMode).toBe("light");
    expect(localStorage.getItem("cf-mode")).toBe("light");
    vi.unstubAllGlobals();
  });

  it("迁移：旧 theme=light key → cf-mode，删除旧 key", () => {
    localStorage.setItem("theme", "light");
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(localStorage.getItem("cf-mode")).toBe("light");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(result.current.mode).toBe("light");
    vi.unstubAllGlobals();
  });

  it("迁移：旧 theme=dark key → cf-mode", () => {
    localStorage.setItem("theme", "dark");
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(localStorage.getItem("cf-mode")).toBe("dark");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(result.current.mode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("读已有 cf-theme 时用已存值", () => {
    localStorage.setItem("cf-theme", "purple");
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("purple");
    expect(document.documentElement.getAttribute("data-theme")).toBe("purple");
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: 跑测试验证失败**

Run: `cd /workspace && npx vitest run tests/hooks/useTheme.test.ts 2>&1 | tail -15`
Expected: FAIL（useTheme 还是旧实现，返回 `{ theme, toggle }` 而非 `{ theme, mode, resolvedMode, setTheme, setMode, toggleMode }`）

- [ ] **Step 3: 写实现**

把 `src/hooks/useTheme.ts` 整体替换为：

```ts
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
```

关键点：
- `migrate()` 在 getInitialTheme/getInitialMode 都调用（幂等，重复调用安全）
- system 模式监听 matchMedia change 事件，实时跟随系统
- toggleMode 总是切换到明确的 light/dark（脱离 system）
- mode 持久化单独 useEffect，system 也存（记录用户选择"跟随系统"）

- [ ] **Step 4: 跑测试验证通过**

Run: `cd /workspace && npx vitest run tests/hooks/useTheme.test.ts 2>&1 | tail -10`
Expected: 11 tests passed

- [ ] **Step 5: 跑全量测试确认无回归**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 全部通过（原 72 - 4 旧 useTheme + 11 新 useTheme = 79）

- [ ] **Step 6: 提交**

```bash
cd /workspace && git add src/hooks/useTheme.ts tests/hooks/useTheme.test.ts && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: useTheme 升级——4 主题 + 3 明暗 + system 监听 + 迁移"
```

---

### Task 3: index.html 无 FOUC + 迁移 inline script

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 修改 index.html 的 script**

把 `index.html` 中现有的 inline script：
```html
    <script>
      (function () {
        var s = localStorage.getItem("theme");
        var d = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        if (d) document.documentElement.classList.add("dark");
      })();
    </script>
```
替换为：
```html
    <script>
      (function () {
        // 迁移旧 theme key 到 cf-mode
        var old = localStorage.getItem("theme");
        if (old === "light" || old === "dark") {
          if (!localStorage.getItem("cf-mode")) {
            localStorage.setItem("cf-mode", old);
          }
          localStorage.removeItem("theme");
        }
        // 主题
        var t = localStorage.getItem("cf-theme") || "warm";
        document.documentElement.setAttribute("data-theme", t);
        // 明暗
        var m = localStorage.getItem("cf-mode") || "system";
        var dark = m === "dark" || (m !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
        if (dark) document.documentElement.classList.add("dark");
      })();
    </script>
```

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 跑全量测试**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 79 tests passed

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add index.html && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: index.html 无 FOUC + 旧 key 迁移 inline script"
```

---

### Task 4: ThemeCard 组件

**Files:**
- Create: `src/components/ThemeCard.tsx`

- [ ] **Step 1: 写 ThemeCard 组件**

创建 `src/components/ThemeCard.tsx`：

```tsx
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
```

注意：色块的 `background` 用固定 hex（不随当前主题变），这样用户能看到每个主题的真实主色，而不是被当前主题渲染。

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 提交**

```bash
cd /workspace && git add src/components/ThemeCard.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: ThemeCard 主题色卡组件"
```

---

### Task 5: AppearanceSection 组件（设置页外观区块）

**Files:**
- Create: `src/components/AppearanceSection.tsx`

- [ ] **Step 1: 写 AppearanceSection 组件**

创建 `src/components/AppearanceSection.tsx`：

```tsx
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
```

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 提交**

```bash
cd /workspace && git add src/components/AppearanceSection.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: AppearanceSection 外观区块（主题选择 + 明暗三态）"
```

---

### Task 6: SettingsPage 嵌入 AppearanceSection

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: 修改 SettingsPage.tsx**

在 `src/pages/SettingsPage.tsx` 中：

1a. 加 import（在现有 import 之后）：
```tsx
import { AppearanceSection } from "../components/AppearanceSection";
```

1b. 在 `<div className="page-header">...</div>` 之后、`<div className="form-field">DeepSeek API Key...</div>` 之前插入：
```tsx
      <AppearanceSection />
```

修改后的 SettingsPage.tsx 完整内容：
```tsx
import { useEffect, useState } from "react";
import { getApiKey, saveApiKey, setLastBackupAt } from "../hooks/useSettings";
import { exportAll, importAll } from "../backup/export";
import { useNotify } from "../hooks/useNotify";
import { AppearanceSection } from "../components/AppearanceSection";

export default function SettingsPage() {
  const notify = useNotify();
  const [key, setKey] = useState("");
  useEffect(() => { (async () => setKey(await getApiKey()))(); }, []);
  const save = async () => { await saveApiKey(key); notify.success("已保存"); };
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-xl font-bold">设置</h1>
      </div>
      <AppearanceSection />
      <div className="card space-y-3">
        <div className="form-field">
          <label className="label">DeepSeek API Key</label>
          <input type="password" value={key} onChange={e => setKey(e.target.value)}
            className="input" placeholder="sk-..." />
        </div>
        <button onClick={save} className="btn-primary">保存</button>
        <p className="hint">Key 仅存在本机浏览器，不会上传。</p>
      </div>
      <div className="card space-y-3">
        <h2 className="section-title">数据备份</h2>
        <p className="text-xs text-orange-600">导出文件含学生信息，请妥善保管。</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            const blob = new Blob([await exportAll()], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `kehoufankui-backup-${Date.now()}.json`; a.click();
            await setLastBackupAt(Date.now());
            notify.success("已导出");
          }} className="btn-soft">导出全部数据</button>
          <label className="btn-soft cursor-pointer">
            导入数据
            <input type="file" accept="application/json" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              try {
                await importAll(await f.text());
                notify.success("导入完成，请刷新页面");
              } catch (err: any) { notify.error("导入失败：" + err.message); }
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}
```

改动要点：
- 加 AppearanceSection import
- 顶部 page-header 后插入 `<AppearanceSection />`
- API Key 区块包入 `.card`（原裸露）
- 数据备份区块包入 `.card`（原 border-t 分隔）
- space-y-4 → space-y-6（页面区块间距加大）

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 跑全量测试**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 79 tests passed

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add src/pages/SettingsPage.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: SettingsPage 嵌入外观区块 + 卡片化布局"
```

---

### Task 7: App.tsx ThemeToggle 改造 + 品牌名

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 修改 App.tsx**

修改 `src/App.tsx` 中 ThemeToggle 函数和导航栏品牌名。

1a. 把 ThemeToggle 函数：
```tsx
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button onClick={toggle} className="btn-ghost p-2 shrink-0" aria-label="切换主题">
      <Icon className="w-4 h-4" />
    </button>
  );
}
```
替换为：
```tsx
function ThemeToggle() {
  const { resolvedMode, toggleMode } = useTheme();
  const Icon = resolvedMode === "dark" ? Sun : Moon;
  return (
    <button onClick={toggleMode} className="btn-ghost p-2 shrink-0" aria-label="切换明暗">
      <Icon className="w-4 h-4" />
    </button>
  );
}
```

1b. 把导航栏品牌名：
```tsx
              <NavLink to="/" className="flex items-center gap-2 mr-2 font-bold text-text shrink-0">
                <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
                <span className="hidden sm:inline">课后反馈生成器</span>
              </NavLink>
```
替换为：
```tsx
              <NavLink to="/" className="flex items-center gap-2 mr-2 font-bold text-text shrink-0">
                <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
                <span className="hidden sm:inline">ClassFlow · 课后反馈</span>
              </NavLink>
```

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 跑全量测试**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 79 tests passed

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add src/App.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: App ThemeToggle 改用 toggleMode + 品牌名 ClassFlow"
```

---

### Task 8: HomePage hero eyebrow + ClassFlow 文案

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: 修改 HomePage.tsx**

把 `src/pages/HomePage.tsx` 整体替换为：

```tsx
import { Link } from "react-router-dom";

const STEPS: { n: number; title: string; desc: string; to: string; cta: string }[] = [
  { n: 1, title: "填入 API Key", desc: "在设置页填入你的 DeepSeek API Key，仅存在本机浏览器，不上传。", to: "/settings", cta: "去设置" },
  { n: 2, title: "添加学生", desc: "录入学生姓名、年级、性格、薄弱点、家长关注点，可设常用科目自动匹配规范档。", to: "/students", cta: "去添加" },
  { n: 3, title: "选/学规范档", desc: "选一套内置风格，或上传历史反馈让 AI 学习你机构的写法。", to: "/spec", cta: "去规范档" },
  { n: 4, title: "生成反馈", desc: "录音或手动输入本节课内容，AI 按规范档生成个性化反馈，可编辑后保存。", to: "/generate", cta: "去生成" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="card">
        <div className="text-[11px] tracking-[2px] uppercase text-text-muted mb-2">FOR EDUCATORS</div>
        <h1 className="page-title text-3xl font-bold">ClassFlow · 课后反馈生成器</h1>
        <p className="mt-3 text-text-muted text-sm leading-relaxed">
          录音或手动输入课程内容，AI 学习你的历史反馈风格，一键生成符合机构规范的个性化课后反馈。
          数据全部存于本机浏览器，安全可控。
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">快速开始</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STEPS.map(s => (
            <div key={s.n} className="card-accent card-hover">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text">{s.title}</h3>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">{s.desc}</p>
                  <Link to={s.to} className="inline-block mt-3 text-sm text-primary hover:underline">
                    {s.cta} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card border-amber-300 bg-amber-50">
        <p className="text-sm text-amber-800">
          <b>提示：</b>数据存在本机浏览器的 IndexedDB 中，清除浏览器数据会导致丢失，请定期在「设置 → 导出」备份。
        </p>
      </div>
    </div>
  );
}
```

改动要点：
- hero 加 eyebrow `FOR EDUCATORS`（11px 大写间距 2px）
- h1 用 `page-title` class（衬线字体）+ text-3xl
- 标题改为 "ClassFlow · 课后反馈生成器"
- 序号徽章：圆形 → `rounded-lg`（圆角方），w-7 h-7 → w-8 h-8
- 间距：space-y-6 → space-y-8，gap-3 → gap-4，mb-3 → mb-4
- amber 提示卡用 border-amber-300 bg-amber-50（保持警告色，跨主题统一）

- [ ] **Step 2: tsc + build 验证**

Run: `cd /workspace && npm run build 2>&1 | tail -5`
Expected: build 成功

- [ ] **Step 3: 跑全量测试**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 79 tests passed

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add src/pages/HomePage.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: HomePage hero eyebrow + ClassFlow 文案 + 衬线标题 + 间距优化"
```

---

## 完成后验证（非 Task，最后一步）

- [ ] **全量测试 + tsc + build + 体积检查**

```bash
cd /workspace && npx vitest run 2>&1 | tail -8 && npm run build 2>&1 | tail -8
```

体积检查：
```bash
cd /workspace && ls -la dist/assets/*.js | awk '{print $5, $9}' && gzip -c dist/assets/index-*.js | wc -c
```
Expected: gzip 后约 148kb（当前 145kb + 净增 ~2.5kb）

- [ ] **grep 残留检查**

```bash
cd /workspace && grep -rn 'localStorage.getItem("theme")' src/ index.html
```
Expected: 只在 `src/hooks/useTheme.ts` 的 migrate 函数里出现一次（迁移代码），index.html 的 inline script 里出现一次（迁移代码）。其他地方不应有。

```bash
cd /workspace && grep -rn '\.toggle\b' src/
```
Expected: 无结果（旧的 toggle 方法已改为 toggleMode）

- [ ] **推送部署 + 线上验证**

```bash
cd /workspace && git push https://<TOKEN>@github.com/qbjsdsb/classroomfeedback.git master
```

轮询 GitHub Actions 等 success，然后线上验证：
1. 设置页可切换 4 主题，实时预览
2. 设置页可切换 3 明暗模式
3. 刷新页面主题和明暗保持
4. 标题用衬线字体（macOS 可见）
5. 卡片圆角 14px，阴影带主色 tint
6. 导航栏显示 "ClassFlow · 课后反馈"
7. hero 区有 FOR EDUCATORS eyebrow
8. 导航栏 ThemeToggle 点击 light↔dark 切换

---

## Self-Review 自检

**1. Spec coverage：**
- 4 主题色板（spec §3）→ Task 1 ✓
- 排版/圆角/阴影（spec §4）→ Task 1 ✓
- 设置页外观区块（spec §5）→ Task 4/5/6 ✓
- useTheme 升级（spec §6）→ Task 2 ✓
- 迁移策略（spec §7）→ Task 2（migrate 函数）+ Task 3（inline script）✓
- 导航栏 ThemeToggle 改造（spec §8）→ Task 7 ✓
- 测试策略（spec §9）→ Task 2 TDD + 各 Task build 验证 ✓
- 品牌识别 ClassFlow（spec §4.7）→ Task 7（导航栏）+ Task 8（hero）✓
- 无 FOUC（spec §7.3）→ Task 3 ✓
- 验收标准（spec §13）→ 最后验证步骤全覆盖 ✓

**2. Placeholder scan：** 无 TBD/TODO，所有代码完整 ✓

**3. Type consistency：**
- `ThemeName = "warm" | "blue" | "green" | "purple"` — Task 2 定义，Task 4/5 使用 ✓
- `Mode = "light" | "dark" | "system"` — Task 2 定义，Task 5/7 使用 ✓
- `UseThemeReturn` 接口 — Task 2 返回 `{ theme, mode, resolvedMode, setTheme, setMode, toggleMode }`，Task 7 用 `resolvedMode`/`toggleMode`，Task 5 用 `theme`/`mode`/`setTheme`/`setMode` ✓
- `ThemeMeta` 接口 — Task 4 定义，Task 5 使用 ✓
- CSS 变量名 `--bg/--surface/--primary` 等 — Task 1 定义，tailwind.config 已映射（Task 1 不改 config）✓
- `.theme-card*` / `.mode-btn*` class — Task 1 定义，Task 4/5 使用 ✓

**自检发现并补充：**
- Task 1 的 `.card-hover` 改为只控制 transition，hover 效果写在 `:hover` 里（避免和 `.card` 的 box-shadow 冲突）——已在 Task 1 Step 1 代码体现
- Task 2 的 mode 持久化 useEffect 包含 system（记录用户选"跟随系统"）——已在代码体现
- Task 4 的 ThemeCard 色块用固定 hex（不随当前主题变），让用户看到每个主题真实主色——已加注释
- Task 8 的 amber 提示卡保持警告色（跨主题统一），不迁移到语义色——已加注释
