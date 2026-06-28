# UI 统一与暗色模式 设计

## 1. 目标

在不影响性能（主 JS gzip < 115kb）的前提下，统一 7 页 + 详情页的视觉风格，并加入暗色模式。引入 3 个轻量库（clsx + lucide-react + @headlessui/react）解决 className 整洁、图标统一、原生 select/自研 Modal 的暗色模式短板。

## 2. 范围

**纳入**（一期统一基础 + 暗色 + 轻量库）：
- 设计令牌统一（CSS 变量语义色）
- 暗色模式（class 策略 + localStorage + 跟随系统 + 无 FOUC）
- 页面骨架统一（page-header / section-title / form-field / card 层次）
- 按钮语义统一（primary/ghost/danger/success）
- 图标统一（lucide-react 替代 emoji）
- 表单控件统一（HeadlessUI Listbox 替代原生 select，clsx 整理 className）
- Modal 升级（HeadlessUI Dialog 替代自研，补焦点陷阱）

**不纳入**（YAGNI，留待后续）：
- 移动端深度响应式（仅做必要断点）
- 动画库 / 图表库
- shadcn/ui 全量迁移

## 3. 技术栈与体积预算

| 库 | 版本 | gzip | 用途 |
|---|---|---|---|
| clsx | ^2.1.1 | ~0.3kb | 条件 className |
| lucide-react | ^0.460.0 | ~0.5kb/图标(按需) | SVG 图标 |
| @headlessui/react | ^2.2.0 | ~3kb | Listbox + Dialog |

当前主 JS gzip 103kb。新增预算 < 12kb → 目标 < 115kb gzip。Tailwind purge 保证新增 class 不膨胀 CSS。

## 4. 暗色模式机制

- **策略**：`darkMode: "class"`，`<html class="dark">` 控制
- **存储**：`localStorage("theme")` 存 `"light"|"dark"`
- **初始**：无 localStorage 时读 `prefers-color-scheme: dark`
- **无 FOUC**：index.html 内联一段同步脚本，在 React 加载前根据 localStorage/系统偏好设 `<html class>`
- **切换器**：导航条右侧 lucide Sun/Moon 图标按钮

## 5. 设计令牌（CSS 变量 + tailwind.config）

### 5.1 index.css 变量定义

```css
:root {
  --bg: 248 250 252;          /* gray-50 */
  --surface: 255 255 255;     /* white */
  --surface-2: 243 244 246;   /* gray-100 */
  --border: 229 231 235;      /* gray-200 */
  --text: 31 41 55;           /* gray-800 */
  --text-muted: 107 114 128;  /* gray-500 */
  --primary: 37 99 235;       /* blue-600 */
  --primary-hover: 29 78 216; /* blue-700 */
  --primary-surface: 219 234 254; /* blue-50 */
}
.dark {
  --bg: 17 24 39;             /* gray-900 */
  --surface: 31 41 55;        /* gray-800 */
  --surface-2: 55 65 81;      /* gray-700 */
  --border: 55 65 81;         /* gray-700 */
  --text: 229 231 235;        /* gray-200 */
  --text-muted: 156 163 175;  /* gray-400 */
  --primary: 59 130 246;      /* blue-500（暗色提亮一档） */
  --primary-hover: 96 165 250;/* blue-400 */
  --primary-surface: 30 58 138; /* blue-900 */
}
```

### 5.2 tailwind.config.js 映射

```js
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
};
```

注意：colors 里把 `border`/`text` 这种覆盖 Tailwind 原生 utility 名（`border-border`、`text-text`）。原项目用 `border-gray-200`/`text-gray-800` 的地方需迁移到语义色。`bg-bg` 略拗口但语义清晰。

## 6. 组件层（index.css @layer components）

全部用语义色变量，明暗自动切换。

| class | 定义 | 替代 |
|---|---|---|
| `.page-header` | `flex items-center justify-between gap-2 mb-3` | 各页手写 flex |
| `.section-title` | `text-base font-semibold text-text` | 散落 h2 |
| `.card` | `bg-surface border border-border rounded-lg p-4 shadow-card` | 硬编码 bg-white |
| `.card-accent` | `.card` 基础 + `border-l-4 border-l-primary` | 无主次 |
| `.form-field` | `space-y-1`（内含 `.label` + `.input`） | 三种表单写法 |
| `.input` | `w-full px-3 py-2 rounded border border-border bg-surface text-text focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none` | 硬编码 gray-300 |
| `.label` | `block text-sm font-medium text-text` | - |
| `.hint` | `text-xs text-text-muted` | - |
| `.btn-primary` | `px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50` | - |
| `.btn-ghost` | `px-3 py-1.5 rounded text-text hover:bg-surface-2` | - |
| `.btn-danger` | `px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700` | - |
| `.btn-success` | `px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700` | - |
| `.nav-link` | `px-3 py-1.5 rounded text-sm transition-colors`，active 时 `bg-primary-surface text-primary font-medium`，inactive 时 `text-text-muted hover:bg-surface-2 hover:text-text` | App.tsx 内联三元 |

## 7. 主题 Hook（src/hooks/useTheme.ts）

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
  const toggle = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  return { theme, toggle };
}
```

### 7.1 无 FOUC 初始化（index.html 内联脚本）

在 `<head>` 里 `<script>` 块，在应用 JS 加载前执行：

```html
<script>
  (function() {
    var s = localStorage.getItem("theme");
    var d = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    if (d) document.documentElement.classList.add("dark");
  })();
</script>
```

## 8. 库集成

### 8.1 clsx 使用规范
所有条件 className 用 clsx，消除散落三元。例：
```tsx
import { clsx } from "clsx";
<button className={clsx("btn-ghost", isActive && "bg-primary-surface text-primary")}>
```

### 8.2 lucide-react 图标映射
替代散落 emoji，统一视觉。映射：
- 📭 → `Inbox`（EmptyState）
- ☀/🌙 → `Sun`/`Moon`（主题切换）
- 删除 → `Trash2`
- 编辑 → `Pencil`
- 复制 → `Copy`
- 保存 → `Save`
- 生成 → `Sparkles`（AI 操作）
- 录音 → `Mic`
- 新建 → `Plus`
- 导航各页用对应图标（Users/Settings/BarChart3 等）

按需 import：`import { Sun, Moon, Trash2 } from "lucide-react"`。tree-shake 只打包用到的。

### 8.3 HeadlessUI Listbox 封装（src/components/Select.tsx）

封装一个 `Select<T>` 组件替代原生 `<select>`，API 与原生接近但样式/暗色可控：

```tsx
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption<T> { value: T; label: string; }

export function Select<T extends string | number>({
  value, options, placeholder, onChange, className,
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
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </ListboxButton>
      <ListboxOptions className="mt-1 w-full rounded border border-border bg-surface shadow-card-hover focus:outline-none">
        {options.map(o => (
          <ListboxOption key={String(o.value)} value={o.value} className={({ active }) => clsx("px-3 py-2 text-sm cursor-pointer", active ? "bg-primary-surface text-primary" : "text-text")}>
            {o.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
```

### 8.4 HeadlessUI Dialog 替换自研 Modal

NotificationProvider 的 Modal 部分改为 HeadlessUI Dialog（保留 confirm Promise API 不变）：

```tsx
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
// Modal 渲染
<Dialog open={modal.open} onClose={() => modal.resolve?.(false)} className="relative z-50">
  <div className="fixed inset-0 bg-black/40" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel className="w-full max-w-sm rounded-lg bg-surface p-5 shadow-card-hover">
      <DialogTitle className="font-semibold text-text">{modal.title}</DialogTitle>
      {modal.message && <p className="mt-2 text-sm text-text-muted">{modal.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => resolve(false)} className="btn-ghost">取消</button>
        <button onClick={() => resolve(true)} className="btn-primary">确认</button>
      </div>
    </DialogPanel>
  </div>
</Dialog>
```

好处：自动焦点陷阱、ESC、点遮罩关闭、aria 属性齐全。

## 9. 改造清单（文件级）

| 文件 | 改动 |
|---|---|
| `package.json` | 加 clsx / lucide-react / @headlessui/react 依赖 |
| `tailwind.config.js` | darkMode:class + colors 映射 CSS 变量 + boxShadow |
| `index.html` | 加无 FOUC inline script |
| `src/index.css` | :root/.dark 变量；改造 .card/.input/.btn-*/.label/.hint；新增 .page-header/.section-title/.form-field/.card-accent/.nav-link |
| `src/hooks/useTheme.ts` | 新建 |
| `src/components/Select.tsx` | 新建（HeadlessUI Listbox 封装） |
| `src/components/NotificationProvider.tsx` | Modal 改 HeadlessUI Dialog；颜色改语义色；Toast 颜色改语义色 |
| `src/components/Skeleton.tsx` | bg-gray-200 → bg-surface-2 |
| `src/components/EmptyState.tsx` | emoji → lucide 图标；颜色语义化 |
| `src/App.tsx` | 导航用 .nav-link + lucide 图标；加主题切换按钮；favicon 用 import.meta.env.BASE_URL |
| `src/pages/HomePage.tsx` | hero/步骤卡语义色；图标 |
| `src/pages/StudentsPage.tsx` | .page-header；表单 .form-field；Select 替换 select；列表卡片化；按钮图标 |
| `src/pages/SpecProfilePage.tsx` | .page-header；.form-field；Select；段落卡 .card-accent |
| `src/pages/GeneratePage.tsx` | .page-header；下拉换 Select；段落勾选 .card-accent；预览 .card-accent；按钮图标 |
| `src/pages/BatchGeneratePage.tsx` | .page-header；Select；结果卡 |
| `src/pages/StatsPage.tsx` | .page-header；柱状条 bg-primary |
| `src/pages/SettingsPage.tsx` | .page-header；.form-field；导入导出按钮图标 |
| `src/pages/StudentDetailPage.tsx` | .page-header；反馈卡；AI 提议 .card-accent |
| `tests/hooks/useTheme.test.ts` | 新建：读/写/toggle/跟随系统 |
| `tests/components/Select.test.tsx` | 新建：选项渲染/选择回调/placeholder |
| `tests/components/NotificationProvider.test.tsx` | 适配 HeadlessUI Dialog（DOM 结构变化） |

## 10. 测试策略

- **逻辑层 TDD**：
  - useTheme：初始读 localStorage、无则读 prefers-color-scheme、toggle 切换并写 localStorage、给 html 加/去 dark class
  - Select：渲染 placeholder、点击展开、选 option 触发 onChange
- **UI 层**：tsc + build 验证；Playwright 线上验证明暗切换 + 各页渲染 + Select 交互 + Modal 焦点
- **回归**：现有 65 测试全过（业务逻辑不动）。NotificationProvider 测试因 DOM 结构变化需适配。

## 11. 边界与风险

| 场景 | 处理 |
|---|---|
| FOUC（首屏闪烁） | index.html inline script 在 React 加载前设 html.dark |
| HeadlessUI Dialog 替换自研 Modal | confirm Promise API 保持不变，只换底层渲染；测试需适配新 DOM（query `.notify-overlay` 改为 HeadlessUI 的 selector） |
| 原生 select → Listbox | 所有 `<select>` 改 Select 组件，value/onChange API 对齐 |
| 渐变 hero（HomePage） | dark 下渐变用语义色 `from-primary/20 to-primary/5` |
| 柱状条颜色 | `bg-primary` 跟随主题 |
| Tailwind colors 覆盖原生名 | `border-border`/`text-text` 拗口但语义清晰；迁移时全局替换 `border-gray-200`→`border-border`、`text-gray-800`→`text-text` 等 |
| 性能 | CSS 变量切换 0 JS 重渲染；库 tree-shake；build 后验证主 JS gzip < 115kb |

## 12. 验收标准

1. 任意页面点右上角主题按钮，明暗平滑切换，无闪烁
2. 刷新页面主题保持（localStorage）；首次访问跟随系统偏好
3. 所有 7 页 + 详情页标题/操作区/表单/列表/按钮视觉统一
4. 所有 select 暗色模式下样式正确（不再是系统白色 option）
5. Modal 有焦点陷阱，Tab 不会跑到背后
6. 无硬编码 `bg-white`/`text-gray-800`/`border-gray-200` 等裸颜色 class 残留
7. 主 JS gzip < 115kb（性能红线）
8. 65 + 新增测试全过，build 成功
9. 线上明暗两种模式 Playwright 截图验证
