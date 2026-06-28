# UI 统一与暗色模式 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入 clsx + lucide-react + HeadlessUI 三个轻量库，统一 7 页 + 详情页视觉风格，加入暗色模式（class 策略 + localStorage + 跟随系统 + 无 FOUC），主 JS gzip < 115kb。

**Architecture:** 纯 CSS 变量驱动语义色（明暗只改变量值，0 运行时开销）；tailwind.config 映射变量到颜色 utility；index.css @layer components 改造 .card/.input/.btn-* 用语义色；HeadlessUI Listbox 封装 Select 组件替代原生 select；HeadlessUI Dialog 替代自研 Modal（补焦点陷阱，Promise API 不变）；useTheme hook 管理主题；index.html inline script 消除 FOUC。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind 3.4 + clsx + lucide-react + @headlessui/react v2。

---

## File Structure

| 文件 | 责任 | 操作 |
|---|---|---|
| `package.json` | 依赖 | 修改 |
| `tailwind.config.js` | darkMode + colors 映射变量 | 修改 |
| `index.html` | 无 FOUC inline script | 修改 |
| `src/index.css` | CSS 变量 + 组件层改造 | 修改 |
| `src/hooks/useTheme.ts` | 主题读写 + toggle | 新建 |
| `tests/hooks/useTheme.test.ts` | useTheme TDD | 新建 |
| `src/components/Select.tsx` | HeadlessUI Listbox 封装 | 新建 |
| `tests/components/Select.test.tsx` | Select TDD | 新建 |
| `src/components/NotificationProvider.tsx` | Modal 改 Dialog + 语义色 | 修改 |
| `tests/components/NotificationProvider.test.tsx` | 适配新 DOM | 修改 |
| `src/components/Skeleton.tsx` | 语义色 | 修改 |
| `src/components/EmptyState.tsx` | lucide 图标 + 语义色 | 修改 |
| `src/App.tsx` | nav-link + 主题按钮 + favicon | 修改 |
| `src/pages/HomePage.tsx` | page-header + 语义色 | 修改 |
| `src/pages/StatsPage.tsx` | page-header + 柱状条语义色 | 修改 |
| `src/pages/SettingsPage.tsx` | page-header + form-field | 修改 |
| `src/pages/StudentsPage.tsx` | page-header + form-field + Select + 列表卡片化 | 修改 |
| `src/pages/SpecProfilePage.tsx` | page-header + form-field + Select | 修改 |
| `src/pages/GeneratePage.tsx` | page-header + Select + card-accent | 修改 |
| `src/pages/BatchGeneratePage.tsx` | page-header + Select | 修改 |
| `src/pages/StudentDetailPage.tsx` | page-header + card-accent | 修改 |

---

### Task 1: 基础设施（依赖 + tailwind.config + index.css + index.html）

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.js`
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: 安装依赖**

Run: `cd /workspace && npm install clsx@^2.1.1 lucide-react@^0.460.0 @headlessui/react@^2.2.0 2>&1 | tail -5`
Expected: 3 个包加入 dependencies，无报错

- [ ] **Step 2: 整体替换 tailwind.config.js**

把 `tailwind.config.js` 整体替换为：

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          surface: "rgb(var(--primary-surface) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
        "card-hover": "0 4px 12px -2px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: 整体替换 src/index.css**

把 `src/index.css` 整体替换为：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
  }
  :root {
    --bg: 248 250 252;
    --surface: 255 255 255;
    --surface-2: 243 244 246;
    --border: 229 231 235;
    --text: 31 41 55;
    --text-muted: 107 114 128;
    --primary: 37 99 235;
    --primary-hover: 29 78 216;
    --primary-surface: 219 234 254;
  }
  .dark {
    --bg: 17 24 39;
    --surface: 31 41 55;
    --surface-2: 55 65 81;
    --border: 55 65 81;
    --text: 229 231 235;
    --text-muted: 156 163 175;
    --primary: 59 130 246;
    --primary-hover: 96 165 250;
    --primary-surface: 30 58 138;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC",
      sans-serif;
    @apply bg-bg text-text antialiased;
  }
}

@layer components {
  /* 页面骨架 */
  .page-header {
    @apply flex items-center justify-between gap-2 mb-4;
  }
  .section-title {
    @apply text-base font-semibold text-text;
  }

  /* 卡片层次 */
  .card {
    @apply bg-surface border border-border rounded-lg shadow-card p-4;
  }
  .card-hover {
    @apply transition hover:shadow-card-hover hover:border-primary/40;
  }
  .card-accent {
    @apply card border-l-4 border-l-primary;
  }

  /* 按钮基础 */
  .btn {
    @apply inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary-hover active:opacity-90;
  }
  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700;
  }
  .btn-ghost {
    @apply btn text-primary hover:bg-primary-surface;
  }
  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700;
  }
  .btn-soft {
    @apply btn bg-surface-2 text-text hover:bg-border;
  }

  /* 表单元素 */
  .form-field {
    @apply space-y-1;
  }
  .input {
    @apply block w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text
      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
      placeholder:text-text-muted;
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
    @apply bg-primary-surface text-primary font-medium;
  }
  .nav-link-inactive {
    @apply text-text-muted hover:bg-surface-2 hover:text-text;
  }
}
```

注意：删除了原 `.btn-purple`（不再使用，紫色场景改用 card-accent + 语义色）。原 `card-hover` 的 `hover:border-gray-300` 改为 `hover:border-primary/40`。

- [ ] **Step 4: 修改 index.html 加无 FOUC script**

把 `index.html` 的 `<head>` 内、`<title>` 之后加一段 script。整体替换 index.html：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="为教培老师打造的课后反馈生成器：录音或手动输入课程内容，AI 学习你的历史反馈风格，一键生成个性化反馈。" />
    <title>课后反馈生成器</title>
    <script>
      (function () {
        var s = localStorage.getItem("theme");
        var d = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        if (d) document.documentElement.classList.add("dark");
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: tsc + build 验证（此时页面 class 还没改，会有视觉错乱但 build 必须过）**

Run: `cd /workspace && npm run build 2>&1 | tail -8`
Expected: build 成功（Tailwind 不会因未使用的 class 报错，CSS 变量定义合法）

- [ ] **Step 6: 跑全量测试确认无回归（逻辑层不涉及 CSS）**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 65 tests passed（CSS 改动不影响测试）

- [ ] **Step 7: 提交**

```bash
cd /workspace && git add package.json package-lock.json tailwind.config.js index.html src/index.css && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: 基础设施层——设计令牌 CSS 变量 + 暗色模式 + 依赖"
```

---

### Task 2: useTheme hook（TDD）

**Files:**
- Create: `src/hooks/useTheme.ts`
- Test: `tests/hooks/useTheme.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/hooks/useTheme.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../src/hooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("useTheme", () => {
  it("无 localStorage 时跟随系统 prefers-color-scheme", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("dark"),
      media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    }));
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("有 localStorage=light 时用 light", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggle 切换并写 localStorage", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggle 从 dark 切回 light 时移除 dark class", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
```

- [ ] **Step 2: 跑测试验证失败**

Run: `cd /workspace && npx vitest run tests/hooks/useTheme.test.ts`
Expected: FAIL，`Cannot find module '../../src/hooks/useTheme'`

- [ ] **Step 3: 写实现**

创建 `src/hooks/useTheme.ts`：

```ts
import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);
  return { theme, toggle };
}
```

- [ ] **Step 4: 跑测试验证通过**

Run: `cd /workspace && npx vitest run tests/hooks/useTheme.test.ts`
Expected: PASS，4 tests passed

- [ ] **Step 5: 提交**

```bash
cd /workspace && git add src/hooks/useTheme.ts tests/hooks/useTheme.test.ts && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: useTheme 主题管理 hook（localStorage + 跟随系统）"
```

---

### Task 3: Select 组件（HeadlessUI Listbox 封装，TDD）

**Files:**
- Create: `src/components/Select.tsx`
- Test: `tests/components/Select.test.tsx`

- [ ] **Step 1: 写失败测试**

创建 `tests/components/Select.test.tsx`：

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../../src/components/Select";

describe("Select", () => {
  it("value=null 时显示 placeholder", () => {
    render(
      <Select value={null} options={[{ value: 1, label: "张三" }]} placeholder="选择学生…" onChange={() => {}} />
    );
    expect(screen.getByText("选择学生…")).toBeInTheDocument();
  });

  it("value 匹配时显示对应 label", () => {
    render(
      <Select value={2} options={[{ value: 1, label: "张三" }, { value: 2, label: "李四" }]} onChange={() => {}} />
    );
    expect(screen.getByText("李四")).toBeInTheDocument();
  });

  it("点击展开后选 option 触发 onChange", () => {
    const onChange = vi.fn();
    render(
      <Select value={null} options={[{ value: 1, label: "张三" }, { value: 2, label: "李四" }]} placeholder="选" onChange={onChange} />
    );
    fireEvent.click(screen.getByText("选"));
    fireEvent.click(screen.getByText("李四"));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
```

注意：测试文件顶部需 `import { vi } from "vitest"`，补到 import 行：
```tsx
import { describe, it, expect, vi } from "vitest";
```

- [ ] **Step 2: 跑测试验证失败**

Run: `cd /workspace && npx vitest run tests/components/Select.test.tsx`
Expected: FAIL，`Cannot find module '../../src/components/Select'`

- [ ] **Step 3: 写实现**

创建 `src/components/Select.tsx`：

```tsx
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption<T> {
  value: T;
  label: string;
}

export function Select<T extends string | number>({
  value,
  options,
  placeholder,
  onChange,
  className,
}: {
  value: T | null;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (v: T) => void;
  className?: string;
}) {
  const current = options.find(o => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className={clsx("input flex items-center justify-between text-left", className)}>
        <span className={current ? "text-text" : "text-text-muted"}>
          {current?.label ?? placeholder ?? "请选择…"}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
      </ListboxButton>
      <ListboxOptions className="mt-1 w-full rounded-md border border-border bg-surface shadow-card-hover focus:outline-none z-10">
        {options.map(o => (
          <ListboxOption
            key={String(o.value)}
            value={o.value}
            className={({ active }: { active: boolean }) =>
              clsx("px-3 py-2 text-sm cursor-pointer", active ? "bg-primary-surface text-primary" : "text-text")
            }
          >
            {o.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
```

- [ ] **Step 4: 跑测试验证通过**

Run: `cd /workspace && npx vitest run tests/components/Select.test.tsx`
Expected: PASS，3 tests passed

- [ ] **Step 5: 提交**

```bash
cd /workspace && git add src/components/Select.tsx tests/components/Select.test.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: Select 组件（HeadlessUI Listbox 封装，暗色可控）"
```

---

### Task 4: NotificationProvider 改造（HeadlessUI Dialog + 语义色）

**Files:**
- Modify: `src/components/NotificationProvider.tsx`
- Modify: `tests/components/NotificationProvider.test.tsx`

- [ ] **Step 1: 整体替换 NotificationProvider.tsx**

把 `src/components/NotificationProvider.tsx` 整体替换为：

```tsx
import { createContext, useCallback, useRef, useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { clsx } from "clsx";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";
export interface ToastItem { id: string; type: ToastType; message: string; duration: number; }

export interface NotifyApi {
  success(message: string): string;
  error(message: string): string;
  info(message: string, opts?: { duration?: number }): string;
  dismiss(id?: string): void;
  confirm(title: string, message?: string): Promise<boolean>;
}

export const NotificationContext = createContext<NotifyApi | null>(null);

const MAX_TOASTS = 4;
const DURATION: Record<ToastType, number> = { success: 3000, error: 5000, info: 3000 };

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info };
const TOAST_ICON_COLOR: Record<ToastType, string> = {
  success: "text-emerald-500", error: "text-red-500", info: "text-primary",
};

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); }, []);
  const Icon = TOAST_ICON[item.type];
  return (
    <div className={clsx(
      "bg-surface border border-border shadow-card-hover rounded-md px-3 py-2 flex items-center gap-2 min-w-[200px] max-w-sm transition-all duration-150",
      show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <Icon className={clsx("w-4 h-4 flex-shrink-0", TOAST_ICON_COLOR[item.type])} />
      <span className="flex-1 text-sm text-text">{item.message}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearTimer = useCallback((id: string) => {
    const t = timers.current[id];
    if (t) { clearTimeout(t); delete timers.current[id]; }
  }, []);

  const dismiss = useCallback((id?: string) => {
    setToasts(prev => {
      if (id) {
        clearTimer(id);
        return prev.filter(t => t.id !== id);
      }
      prev.forEach(t => clearTimer(t.id));
      return [];
    });
  }, [clearTimer]);

  const push = useCallback((type: ToastType, message: string, duration: number): string => {
    const id = String(++idRef.current);
    setToasts(prev => {
      const next = [...prev, { id, type, message, duration }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const [modal, setModal] = useState<{ title: string; message?: string; resolve: (ok: boolean) => void } | null>(null);

  const confirm = useCallback((title: string, message?: string): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      setModal({ title, message, resolve });
    });
  }, []);

  const closeModal = useCallback((ok: boolean) => {
    setModal(prev => {
      prev?.resolve(ok);
      return null;
    });
  }, []);

  const api: NotifyApi = {
    success: (m) => push("success", m, DURATION.success),
    error: (m) => push("error", m, DURATION.error),
    info: (m, opts) => push("info", m, opts?.duration ?? DURATION.info),
    dismiss,
    confirm,
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <Dialog open={modal !== null} onClose={() => closeModal(false)} className="relative z-50">
        <div className="modal-overlay fixed inset-0 bg-black/40" onClick={() => closeModal(false)} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-surface border border-border rounded-lg shadow-card-hover max-w-sm w-full p-5 space-y-3">
            <DialogTitle className="font-bold text-text">{modal?.title}</DialogTitle>
            {modal?.message && <p className="text-sm text-text-muted">{modal.message}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => closeModal(false)} className="btn-soft">取消</button>
              <button onClick={() => closeModal(true)} className="btn-primary">确认</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}
```

关键变化：
- Modal 用 HeadlessUI Dialog（自带 ESC + 焦点陷阱），删除自研 ESC useEffect
- 遮罩加 `modal-overlay` class（测试用）
- "确认"按钮从 btn-danger 改 btn-primary（删除是确认操作，不是危险按钮本身）
- Toast 图标改 lucide（CheckCircle2/XCircle/Info）
- 所有颜色改语义色

- [ ] **Step 2: 修改测试适配新 DOM**

修改 `tests/components/NotificationProvider.test.tsx`，把第 157 行的遮罩 selector 从 `.notify-overlay` 改为 `.modal-overlay`：

把：
```ts
    const overlay = document.body.querySelector(".notify-overlay") as HTMLElement;
```
改为：
```ts
    const overlay = document.body.querySelector(".modal-overlay") as HTMLElement;
```

其余测试不变（"确认"/"取消"按钮文字保持，Toast 文字断言保持）。

注意：HeadlessUI Dialog 在测试环境（jsdom）下可能需要 `act`。如果"点遮罩"测试失败，把 fireEvent.click(overlay) 包在 act 内：
```ts
    act(() => { fireEvent.click(overlay); });
```
但先按原样跑，失败再加 act。

- [ ] **Step 3: 跑测试验证**

Run: `cd /workspace && npx vitest run tests/components/NotificationProvider.test.tsx 2>&1 | tail -15`
Expected: 10 tests passed。如果"点遮罩"失败，按 Step 2 注意点加 act 后重试。

- [ ] **Step 4: 跑全量测试确认无回归**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 全部通过（原 65 + 新 useTheme 4 + Select 3 = 72，本 Task 不新增测试但 NotificationProvider 10 个要全过）

- [ ] **Step 5: tsc + build**

Run: `cd /workspace && npm run build 2>&1 | tail -8`
Expected: build 成功

- [ ] **Step 6: 提交**

```bash
cd /workspace && git add src/components/NotificationProvider.tsx tests/components/NotificationProvider.test.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: NotificationProvider 改用 HeadlessUI Dialog + 语义色 + lucide 图标"
```

---

### Task 5: Skeleton + EmptyState 语义化

**Files:**
- Modify: `src/components/Skeleton.tsx`
- Modify: `src/components/EmptyState.tsx`

- [ ] **Step 1: 修改 Skeleton.tsx**

把 `src/components/Skeleton.tsx` 整体替换为：

```tsx
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
```

- [ ] **Step 2: 修改 EmptyState.tsx**

把 `src/components/EmptyState.tsx` 整体替换为：

```tsx
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
```

- [ ] **Step 3: tsc + build + 全量测试**

Run: `cd /workspace && npm run build 2>&1 | tail -5 && npx vitest run 2>&1 | tail -5`
Expected: build 成功，测试全过

- [ ] **Step 4: 提交**

```bash
cd /workspace && git add src/components/Skeleton.tsx src/components/EmptyState.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: Skeleton/EmptyState 语义色 + lucide 图标"
```

---

### Task 6: App.tsx 导航 + 主题切换按钮

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 先 Read 当前 App.tsx 确认结构**

Run: Read `/workspace/src/App.tsx`，了解导航结构、NavLink 用法、BackupReminder 子组件位置。

- [ ] **Step 2: 修改 App.tsx**

在 `src/App.tsx` 做以下改动（先 Read 确认行号，以下为改动要点）：

**2a. 加 import：**
```tsx
import { clsx } from "clsx";
import { Sun, Moon, Users, FileText, Sparkles, Layers, BarChart3, Settings, BookOpen } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
```

**2b. 导航项加图标映射：**
导航数组每项加 `icon` 字段，映射到 lucide 图标：
- 首页 → BookOpen
- 学生 → Users
- 规范档 → FileText
- 生成反馈 → Sparkles
- 批量生成 → Layers
- 统计 → BarChart3
- 设置 → Settings

**2c. NavLink className 用 clsx + nav-link：**
把现有 NavLink 的 className 内联三元改为：
```tsx
<NavLink
  to={item.to}
  className={({ isActive }) => clsx("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")}
>
  <item.icon className="w-4 h-4" />
  <span>{item.label}</span>
</NavLink>
```

**2d. 加主题切换按钮：**
在导航条右侧（导航项之后）加：
```tsx
<ThemeToggle />
```

ThemeToggle 作为 App.tsx 内的子组件（或内联）：
```tsx
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button onClick={toggle} className="btn-ghost p-2" aria-label="切换主题">
      <Icon className="w-4 h-4" />
    </button>
  );
}
```

**2e. favicon img 用 import.meta.env.BASE_URL：**
把 `<img src="/favicon.svg" ...>` 改为 `<img src={`${import.meta.env.BASE_URL}favicon.svg`} ...>`

**2f. 所有颜色 class 迁移语义色：**
- `bg-white` → `bg-surface`
- `text-gray-800` → `text-text`
- `text-gray-600`/`text-gray-500` → `text-text-muted`
- `border-gray-200` → `border-border`
- `bg-gray-50` → `bg-bg`
- `bg-blue-600` → `bg-primary`
- `text-blue-600` → `text-primary`
- `bg-blue-50` → `bg-primary-surface`

- [ ] **Step 3: tsc + build**

Run: `cd /workspace && npm run build 2>&1 | tail -8`
Expected: build 成功

- [ ] **Step 4: 跑全量测试**

Run: `cd /workspace && npx vitest run 2>&1 | tail -5`
Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
cd /workspace && git add src/App.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: App 导航统一 nav-link + 主题切换按钮 + lucide 图标"
```

---

### Task 7: 基础页面统一（Home + Stats + Settings）

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/StatsPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: 修改 HomePage.tsx**

先 Read `/workspace/src/pages/HomePage.tsx`。改动要点：
- 顶部用 `.page-header`（如果有标题+操作区）
- hero card 和步骤卡颜色迁移语义色（`bg-white`→`bg-surface`、`text-gray-*`→`text-text`/`text-text-muted`、`border-gray-200`→`border-border`）
- 渐变如有 `from-blue-*` 改 `from-primary/20 to-primary/5`
- 步骤卡可用 `.card-accent` 突出
- 加 lucide 图标替代 emoji（如有）

- [ ] **Step 2: 修改 StatsPage.tsx**

先 Read `/workspace/src/pages/StatsPage.tsx`。改动要点：
- 顶部 `<h1>` 包入 `.page-header`（无操作区就只包标题）
- 柱状条 `bg-blue-400` → `bg-primary`
- 所有颜色迁移语义色
- `text-blue-700` → `text-primary`

- [ ] **Step 3: 修改 SettingsPage.tsx**

先 Read `/workspace/src/pages/SettingsPage.tsx`。改动要点：
- 顶部用 `.page-header`
- 表单用 `.form-field`（label+input 垂直）
- `text-blue-600`/`text-green-600` → `text-primary`/`text-emerald-600`
- 导入导出按钮可加 lucide 图标（Upload/Download）

- [ ] **Step 4: tsc + build + 全量测试**

Run: `cd /workspace && npm run build 2>&1 | tail -5 && npx vitest run 2>&1 | tail -5`
Expected: build 成功，测试全过

- [ ] **Step 5: 提交**

```bash
cd /workspace && git add src/pages/HomePage.tsx src/pages/StatsPage.tsx src/pages/SettingsPage.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: Home/Stats/Settings 页面统一（page-header + 语义色 + form-field）"
```

---

### Task 8: 表单页面统一（Students + SpecProfile + Generate + Batch + StudentDetail）

**Files:**
- Modify: `src/pages/StudentsPage.tsx`
- Modify: `src/pages/SpecProfilePage.tsx`
- Modify: `src/pages/GeneratePage.tsx`
- Modify: `src/pages/BatchGeneratePage.tsx`
- Modify: `src/pages/StudentDetailPage.tsx`

- [ ] **Step 1: 修改 StudentsPage.tsx**

先 Read。改动要点：
- 顶部用 `.page-header`：`<div className="page-header"><h1>学生管理</h1><button className="btn-primary">+新建</button></div>`（"+新建"从 btn-ghost 改 btn-primary，加 Plus 图标）
- 新建表单用 `.form-field`
- 原生 `<select>`（如果有）替换为 `<Select>` 组件
- 学生列表从 `<ul divide-y>` 改为卡片网格或 `.card` + `card-hover` 列表
- 删除按钮加 Trash2 图标
- 颜色迁移语义色

- [ ] **Step 2: 修改 SpecProfilePage.tsx**

先 Read。改动要点：
- 顶部用 `.page-header`
- 表单用 `.form-field`
- 原生 `<select>` 替换为 `<Select>`
- 段落嵌套卡用 `.card-accent`
- "重新分析"按钮：从 btn-primary 改 btn-soft 或保持，加 Sparkles 图标
- 颜色迁移语义色（`btn-purple` 已删除，改 `btn-primary` 或 `card-accent`）

- [ ] **Step 3: 修改 GeneratePage.tsx**

先 Read。改动要点：
- 顶部用 `.page-header`
- 两个原生 `<select>`（学生/规范档）替换为 `<Select>` 组件
- 段落勾选卡用 `.card-accent`
- 预览卡用 `.card-accent`
- "生成反馈"按钮加 Sparkles 图标
- "AI 纠错"按钮加 Wand2 图标
- 录音按钮加 Mic 图标
- 模板按钮保持 btn-soft
- 颜色迁移语义色

Select 替换示例（学生下拉）：
```tsx
<Select
  value={studentId}
  options={students.map(s => ({ value: s.id, label: s.name }))}
  placeholder="选择学生…"
  onChange={(v) => setStudentId(v)}
/>
```
注意：原 `<select>` 的 `onChange` 是 `e => setStudentId(Number(e.target.value))`，Select 直接传值 `v => setStudentId(v)`（v 已是 number）。

- [ ] **Step 4: 修改 BatchGeneratePage.tsx**

先 Read。改动要点：
- 顶部用 `.page-header`
- 原生 `<select>`（规范档选择）替换为 `<Select>`
- 学生多选列表用 `.card` + `card-hover`
- "拆分并确认"等按钮加图标
- 颜色迁移语义色

- [ ] **Step 5: 修改 StudentDetailPage.tsx**

先 Read。改动要点：
- 顶部用 `.page-header`：标题为学生名，操作区为返回/编辑按钮
- 反馈列表用 `.card`
- AI 提议卡用 `.card-accent`
- 提取画像按钮加 Sparkles 图标
- 颜色迁移语义色

- [ ] **Step 6: tsc + build + 全量测试**

Run: `cd /workspace && npm run build 2>&1 | tail -5 && npx vitest run 2>&1 | tail -5`
Expected: build 成功，测试全过

- [ ] **Step 7: 提交**

```bash
cd /workspace && git add src/pages/StudentsPage.tsx src/pages/SpecProfilePage.tsx src/pages/GeneratePage.tsx src/pages/BatchGeneratePage.tsx src/pages/StudentDetailPage.tsx && GIT_AUTHOR_NAME="trae" GIT_AUTHOR_EMAIL="trae@local" GIT_COMMITTER_NAME="trae" GIT_COMMITTER_EMAIL="trae@local" git commit -m "feat: 5 个表单页面统一（page-header + Select + form-field + card-accent + 图标）"
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
Expected: gzip 后 < 115kb（原 103kb + ~10kb 新库）

- [ ] **推送部署 + 线上验证**

```bash
cd /workspace && git push origin master
```

轮询 GitHub Actions 等 success，然后线上验证：
1. 右上角主题按钮点击，明暗平滑切换
2. 刷新页面主题保持
3. 各页视觉统一（标题/表单/按钮/卡片）
4. Select 下拉框暗色模式样式正确
5. Modal 焦点陷阱（Tab 不跑出）
6. 无硬编码 bg-white 残留（浏览器 DevTools 搜 `bg-white` 在 elements 面板应无结果，除特殊语义）

---

## Self-Review 自检

**1. Spec coverage：**
- 暗色模式机制（spec §4）→ Task 1 (config+css+index.html) + Task 2 (useTheme) + Task 6 (切换按钮) ✓
- 设计令牌（spec §5）→ Task 1 ✓
- 组件层（spec §6）→ Task 1 (index.css) ✓
- useTheme（spec §7）→ Task 2 ✓
- 无 FOUC（spec §7.1）→ Task 1 Step 4 ✓
- clsx 使用（spec §8.1）→ Task 3/4/6 全程用 ✓
- lucide 图标映射（spec §8.2）→ Task 4/5/6/7/8 ✓
- HeadlessUI Listbox（spec §8.3）→ Task 3 + Task 8 替换所有 select ✓
- HeadlessUI Dialog（spec §8.4）→ Task 4 ✓
- 改造清单（spec §9）→ Task 1-8 逐文件覆盖 ✓
- 测试策略（spec §10）→ Task 2/3 TDD + Task 4 适配 + 各 Task build 验证 ✓
- 边界：FOUC → Task 1 Step 4 ✓；Modal 测试适配 → Task 4 Step 2 ✓；原生 select 替换 → Task 8 ✓；性能 → 最后体积检查 ✓
- 验收标准（spec §12）→ 最后验证步骤全覆盖 ✓

**2. Placeholder scan：** Task 6/7/8 因需先 Read 确认当前代码再改，用"改动要点"描述而非完整代码——这是合理的，因为页面文件较大且已有内容，完整重写易引入回归。但每个"改动要点"都给出了具体的 class 映射和组件替换示例，工程师有足够信息执行。无 TBD/TODO。✓

**3. Type consistency：**
- `Select<T extends string | number>` — Task 3 定义，Task 8 使用，value/onChange 类型对齐 ✓
- `useTheme()` 返回 `{ theme, toggle }` — Task 2 定义，Task 6 使用 ✓
- `SelectOption<T>` — Task 3 定义 ✓
- CSS 变量名 `--bg/--surface/--border/--text/--primary` 等 — Task 1 定义，tailwind.config 映射，各处使用一致 ✓
- `.modal-overlay` class — Task 4 定义（遮罩），Task 4 测试使用 ✓
- `.page-header/.form-field/.card-accent/.nav-link` — Task 1 定义，Task 6/7/8 使用 ✓

**自检发现并补充：**
- Task 4 Step 2：HeadlessUI Dialog 在 jsdom 下点遮罩测试可能需 act 包裹，已加注意点
- Task 8 Select 替换：onChange 签名从 `e => setX(Number(e.target.value))` 改为 `v => setX(v)`，已加示例说明
- Task 6 ThemeToggle：作为 App 内子组件，避免单独建文件（YAGNI）
- Task 1 Step 3：删除了原 `.btn-purple`，SpecProfilePage 的 btn-purple 用法在 Task 8 改为 btn-primary 或 card-accent
