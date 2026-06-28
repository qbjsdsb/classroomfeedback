# UI 精致化重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ClassFlow 课后反馈生成器的视觉精致化升级——favicon 换温暖棕、页面宽度约束到 max-w-5xl、首页 hero 渐变+CTA、学生/反馈列表网格化+信息层次、学生编辑表单分区、统计页指标卡、Skeleton shimmer、EmptyState 参数化图标、卡片/导航/按钮微交互。

**Architecture:** 纯前端视觉改造，不改业务逻辑、不改数据结构。CSS 变量驱动语义色（已有），本次只追加新组件层 class 和改造页面 JSX。移动端用条件渲染汉堡菜单（不引入 HeadlessUI Disclosure）。StatCard 为新子组件，其他改动都在现有文件内。

**Tech Stack:** React 18 + TypeScript + Tailwind CSS 3.4 + lucide-react + clsx

---

## 关键约束（所有 Task 通用）

1. **不改 useStats hook 数据结构**：StatsPage 只用现有 `{ total, byType, byDay, recent7 }` 数据做视觉升级
2. **不丢字段**：StudentsPage 编辑表单重组时，6 个字段（name/grade/personality/weaknesses/parentFocus/defaultSubject）必须全部迁移
3. **不改业务逻辑**：所有按钮的 onClick、表单的 onChange、状态管理保持不变，只改 className 和 JSX 结构
4. **每 Task 完成后验证**：`npm run build`（tsc + vite build）必须通过
5. **commit 规范**：`refactor(ui): <简述>` 或 `feat(ui): <简述>`

---

### Task 1: favicon.svg 升级

**Files:**
- Modify: `public/favicon.svg`（整体替换）

- [ ] **Step 1: 替换 favicon.svg**

将 `public/favicon.svg` 整体替换为：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#7a5c3e"/>
  <path d="M16 9 C 13 7, 9 7, 6 8 L 6 23 C 9 22, 13 22, 16 24" 
        fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M16 9 C 19 7, 23 7, 26 8 L 26 23 C 23 22, 19 22, 16 24" 
        fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="16" y1="9" x2="16" y2="24" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

- 现状是 64×64 蓝色 `#2563eb` + 加号图标，改为 32×32 温暖棕 `#7a5c3e` + 打开书本
- viewBox 改 32×32 更紧凑，适配各种尺寸
- 书本用两段贝塞尔曲线 + 居中线，白色线条

- [ ] **Step 2: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功（favicon 不影响 build）

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add public/favicon.svg && git commit -m "refactor(ui): favicon 换温暖棕书本图标"
```

---

### Task 2: index.css 追加新样式

**Files:**
- Modify: `src/index.css`（在 `@layer components` 末尾追加，不改动现有样式）

- [ ] **Step 1: 在 index.css 末尾追加新样式**

在 `src/index.css` 的 `@layer components { ... }` 块**结束之前**（最后一个 `}` 之前）追加以下内容。注意：现有 index.css 已有 `.card` `.btn-primary` `.nav-link` 等样式，本次只追加新增的，不改动现有。

追加内容：

```css

  /* ============ 新增：hero 渐变背景 ============ */
  .hero-gradient {
    background: linear-gradient(135deg, 
      rgb(var(--primary) / 0.08) 0%, 
      rgb(var(--primary-surface) / 0.5) 100%);
  }

  /* ============ 新增：Skeleton shimmer 动画 ============ */
  .skeleton-shimmer {
    background: linear-gradient(90deg,
      rgb(var(--surface-2)) 0%,
      rgb(var(--border)) 50%,
      rgb(var(--surface-2)) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-shimmer { animation: none; }
  }

  /* ============ 新增：微交互 ============ */
  /* 卡片悬停上浮（强化现有 .card-hover） */
  .card-hover {
    @apply transition;
    transition-property: transform, box-shadow, border-color;
    transition-duration: 0.2s;
    transition-timing-function: ease;
  }
  .card-hover:hover {
    transform: translateY(-2px);
    border-color: rgb(var(--primary) / 0.4);
    box-shadow: 0 2px 4px rgb(var(--primary) / 0.06),
                0 8px 24px -6px rgb(var(--primary) / 0.12);
  }

  /* 导航链接下划线动画 */
  .nav-link {
    position: relative;
  }
  .nav-link::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background: rgb(var(--primary));
    transition: width 0.2s ease, left 0.2s ease;
  }
  .nav-link:hover::after {
    width: 100%;
    left: 0;
  }
  .nav-link-active::after { display: none; }

  /* 表单聚焦过渡 */
  .input {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  /* 主题色卡 hover 放大（强化现有） */
  .theme-card {
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .theme-card:hover {
    transform: translateY(-2px);
  }

  /* 键盘焦点环 */
  *:focus-visible {
    outline: 2px solid rgb(var(--primary));
    outline-offset: 2px;
  }
  button:focus-visible, a:focus-visible {
    outline-offset: 2px;
    border-radius: 4px;
  }
```

**重要**：因为 index.css 已有 `.card-hover` `.nav-link` `.input` `.theme-card` 的定义，本次追加会覆盖部分属性。需确认追加位置在原定义之后（CSS 后定义覆盖前定义）。如果担心冲突，可以把原 `.card-hover` 块的 `@apply transition;` 删掉（因为新追加的也有），但保留原 hover 样式作为 fallback——实际上新追加的更完整，会覆盖。

**推荐做法**：直接在 `@layer components` 块的最后一个 `}` 之前追加，让新样式生效。原 `.card-hover` 块只保留 `@apply transition;` 一行，新追加的会补充 transform 等。

- [ ] **Step 2: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add src/index.css && git commit -m "refactor(ui): 追加 hero 渐变/shimmer/微交互/focus-visible 样式"
```

---

### Task 3: App.tsx max-w-5xl + 移动端汉堡菜单 + nav.ts

**Files:**
- Create: `src/data/nav.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建 src/data/nav.ts**

```tsx
import { Home, Users, BookOpen, Sparkles, Layers, BarChart3, Settings } from "lucide-react";
import { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "首页", icon: Home, end: true },
  { to: "/students", label: "学生", icon: Users },
  { to: "/spec", label: "规范档", icon: BookOpen },
  { to: "/generate", label: "生成", icon: Sparkles },
  { to: "/batch", label: "批量", icon: Layers },
  { to: "/stats", label: "统计", icon: BarChart3 },
  { to: "/settings", label: "设置", icon: Settings },
];
```

- [ ] **Step 2: 修改 App.tsx**

将 `src/App.tsx` 整体替换为：

```tsx
import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Sun, Moon, Menu, X } from "lucide-react";
import { seedBuiltinProfiles } from "./db/seed";
import { db } from "./db/schema";
import { getLastBackupAt } from "./hooks/useSettings";
import { NotificationProvider } from "./components/NotificationProvider";
import { useNotify } from "./hooks/useNotify";
import { Skeleton } from "./components/Skeleton";
import { useTheme } from "./hooks/useTheme";
import { NAV_ITEMS } from "./data/nav";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import BatchGeneratePage from "./pages/BatchGeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

function BackupReminder() {
  const notify = useNotify();
  useEffect(() => {
    (async () => {
      const students = await db.students.count();
      const feedbacks = await db.feedbacks.count();
      const last = await getLastBackupAt();
      const needRemind =
        (students >= 1 && last === 0) ||
        (feedbacks > 0 && feedbacks % 10 === 0) ||
        (last > 0 && Date.now() - last > 7 * 24 * 3600 * 1000);
      if (needRemind && !sessionStorage.getItem("reminded")) {
        sessionStorage.setItem("reminded", "1");
        notify.info("建议导出备份数据以防丢失（设置 → 导出）");
      }
    })();
  }, [notify]);
  return null;
}

function ThemeToggle() {
  const { resolvedMode, toggleMode } = useTheme();
  const Icon = resolvedMode === "dark" ? Sun : Moon;
  return (
    <button onClick={toggleMode} className="btn-ghost p-2 shrink-0" aria-label="切换明暗">
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { (async () => { await seedBuiltinProfiles(); setReady(true); })(); }, []);
  return (
    <NotificationProvider>
      {!ready ? (
        <div className="p-4"><Skeleton lines={2} /></div>
      ) : (
        <div className="min-h-screen bg-bg">
          <BackupReminder />
          <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-14 flex items-center justify-between gap-4">
                <NavLink to="/" className="flex items-center gap-2 font-bold text-text shrink-0">
                  <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
                  <span className="hidden sm:inline">ClassFlow · 课后反馈</span>
                </NavLink>
                <nav className="hidden sm:flex items-center gap-1">
                  {NAV_ITEMS.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        clsx("nav-link whitespace-nowrap", isActive ? "nav-link-active" : "nav-link-inactive")
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="sm:hidden btn-ghost p-2"
                    aria-label="菜单"
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {mobileOpen && (
                <nav className="sm:hidden pb-3 flex flex-col gap-1">
                  {NAV_ITEMS.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/spec" element={<SpecProfilePage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/batch" element={<BatchGeneratePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      )}
    </NotificationProvider>
  );
}
```

改动要点：
- 删除原 NAV 常量，改用 `import { NAV_ITEMS } from "./data/nav"`
- 删除原 lucide 图标导入（BookOpen/Users/FileText/Sparkles/Layers/BarChart3/Settings），改导入 Menu/X
- `nav` 改 `header`，`max-w-content` → `max-w-5xl`，加 `px-4 sm:px-6 lg:px-8`
- 桌面导航 `hidden sm:flex`，移动端汉堡按钮 `sm:hidden`
- 移动端菜单用 `{mobileOpen && ...}` 条件渲染，路由点击后 `setMobileOpen(false)`
- main 容器 `max-w-content` → `max-w-5xl`，`p-4 sm:p-6` → `px-4 sm:px-6 lg:px-8 py-6`
- 第 1 项图标 BookOpen → Home，label "生成反馈" → "生成"，"批量生成" → "批量"

- [ ] **Step 3: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add src/data/nav.ts src/App.tsx && git commit -m "refactor(ui): max-w-5xl 容器 + 移动端汉堡菜单 + 抽 nav.ts"
```

---

### Task 4: HomePage hero 重设计

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: 修改 HomePage.tsx**

将 `src/pages/HomePage.tsx` 整体替换为：

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
      <section className="card hero-gradient relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/5" />
        <div className="relative">
          <div className="text-[11px] tracking-[2px] uppercase text-text-muted mb-2">FOR EDUCATORS</div>
          <h1 className="page-title text-3xl sm:text-4xl font-bold text-text">
            ClassFlow · 课后反馈生成器
          </h1>
          <p className="mt-3 text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
            录音或手动输入课程内容，AI 学习你的历史反馈风格，一键生成符合机构规范的个性化课后反馈。
            数据全部存于本机浏览器，安全可控。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/generate" className="btn-primary px-4 py-2">立即生成反馈 →</Link>
            <Link to="/students" className="btn-soft px-4 py-2">管理学生</Link>
          </div>
        </div>
      </section>

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
- hero 卡片加 `hero-gradient relative overflow-hidden`
- 加两个装饰性背景圆 `bg-primary/5`
- 内容包 `relative` 避免被装饰圆遮挡
- 标题响应式 `text-3xl sm:text-4xl`
- 段落加 `max-w-2xl` 限制行宽
- 新增 CTA 按钮组（立即生成反馈 + 管理学生）
- 底部 amber 提示卡保留（数据备份提醒）

- [ ] **Step 2: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add src/pages/HomePage.tsx && git commit -m "refactor(ui): hero 渐变背景+装饰圆+CTA 按钮"
```

---

### Task 5: StudentsPage 学生列表网格化 + 编辑表单分区

**Files:**
- Modify: `src/pages/StudentsPage.tsx`

- [ ] **Step 1: 修改 StudentsPage.tsx**

将 `src/pages/StudentsPage.tsx` 整体替换为：

```tsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Student } from "../types";
import { listStudents, createStudent, updateStudent, deleteStudent } from "../hooks/useStudents";
import { useNotify } from "../hooks/useNotify";
import { EmptyState } from "../components/EmptyState";
import { Users } from "lucide-react";

const EMPTY: Omit<Student, "id" | "createdAt"> = { name: "", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "" };

export default function StudentsPage() {
  const notify = useNotify();
  const [list, setList] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id" | "createdAt">>(EMPTY);
  const reload = async () => setList(await listStudents());
  useEffect(() => { reload(); }, []);

  const startNew = () => { setEditing({} as Student); setForm(EMPTY); };
  const startEdit = (s: Student) => { setEditing(s); setForm({ name: s.name, grade: s.grade, personality: s.personality, weaknesses: s.weaknesses, parentFocus: s.parentFocus, defaultSubject: s.defaultSubject }); };
  const submit = async () => {
    if (editing?.id) await updateStudent(editing.id, form);
    else await createStudent(form);
    setForm(EMPTY); setEditing(null); await reload();
    notify.success("已保存");
  };
  const remove = async (id: number) => {
    const ok = await notify.confirm("删除学生", "确认删除该学生？此操作不可撤销。");
    if (ok) { await deleteStudent(id); await reload(); notify.success("已删除"); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title text-xl font-bold">学生管理</h1>
        <button onClick={startNew} className="btn-primary">+ 新建</button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Users} title="暂无学生" hint="添加你的第一个学生档案" action={<button className="btn-primary" onClick={startNew}>新建学生</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(s => (
            <div key={s.id} className="card card-hover flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <NavLink to={`/students/${s.id}`} className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary-surface text-primary flex items-center justify-center font-semibold">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text truncate hover:text-primary">{s.name}</h3>
                    <p className="text-xs text-text-muted">{s.grade || "未填年级"}</p>
                  </div>
                </NavLink>
                {s.defaultSubject && (
                  <span className="shrink-0 bg-primary-surface text-primary text-xs px-2 py-0.5 rounded-md">
                    {s.defaultSubject}
                  </span>
                )}
              </div>
              {s.weaknesses && (
                <p className="mt-3 text-sm text-text-muted line-clamp-2 flex-1">{s.weaknesses}</p>
              )}
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <button onClick={() => startEdit(s)} className="btn-ghost text-xs">编辑</button>
                <button onClick={() => remove(s.id!)} className="btn-ghost text-xs text-red-600">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <>
          <div className="card space-y-4">
            <h2 className="section-title">{editing.id ? "编辑" : "新建"}学生</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label className="label">姓名</label>
                <input className="input" placeholder="姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="label">年级</label>
                <input className="input" placeholder="年级" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label className="label">常用科目（可选，如数学）</label>
              <input className="input" placeholder="常用科目" value={form.defaultSubject} onChange={e => setForm({ ...form, defaultSubject: e.target.value })} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">学习情况</h2>
            <div className="form-field">
              <label className="label">性格特点</label>
              <textarea className="input" rows={2} placeholder="性格特点" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="label">薄弱点</label>
              <textarea className="input" rows={2} placeholder="薄弱点" value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">家长沟通</h2>
            <div className="form-field">
              <label className="label">家长关注点</label>
              <textarea className="input" rows={2} placeholder="家长关注点" value={form.parentFocus} onChange={e => setForm({ ...form, parentFocus: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={submit} className="btn-primary px-4 py-2">保存</button>
            <button onClick={() => setEditing(null)} className="btn-soft px-4 py-2">取消</button>
          </div>
        </>
      )}
    </div>
  );
}
```

改动要点：
- 列表 `grid-cols-1 gap-2` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- 卡片加 `flex flex-col`，内容：头像 + 姓名/年级（NavLink）+ 科目徽章 + 薄弱点（line-clamp-2）+ 编辑/删除按钮（border-t 分隔）
- 编辑表单从单个 card 拆为 3 个分区卡片：基本信息（姓名+年级两列+常用科目）/ 学习情况（性格+薄弱点）/ 家长沟通（家长关注点）
- 表单用 `{editing && (...)}` 控制显隐（原始终显示改为点击新建/编辑后才显示）
- `startNew` 改为 `setEditing({} as Student)`（占位非 null 表示新建模式）
- 长文本字段加 `rows={2}`
- 字段核对：name/grade/personality/weaknesses/parentFocus/defaultSubject 全部迁移 ✓

- [ ] **Step 2: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add src/pages/StudentsPage.tsx && git commit -m "refactor(ui): 学生列表网格化+编辑表单分区"
```

---

### Task 6: StudentDetailPage 反馈列表 2 列网格

**Files:**
- Modify: `src/pages/StudentDetailPage.tsx`

- [ ] **Step 1: 修改反馈列表渲染部分**

**不改其他部分**，只改反馈列表的渲染（`{list.map(f => ...)` 那段）。在 `src/pages/StudentDetailPage.tsx` 中，找到：

```tsx
      {list.map(f => (
        <div key={f.id} className="card space-y-1">
          <p className="text-xs text-text-muted">{new Date(f.createdAt).toLocaleString()} · {f.subject}</p>
          {editId === f.id ? (
            <>
              <textarea className="input h-32" value={editText} onChange={e => setEditText(e.target.value)} />
              <button onClick={() => saveEdit(f.id!)} className="btn-ghost">保存</button>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{f.finalText}</p>
              <div className="flex gap-2 text-sm items-center">
                <button onClick={() => { setEditId(f.id!); setEditText(f.finalText); }} className="btn-ghost">编辑</button>
                <button onClick={() => navigator.clipboard.writeText(f.finalText)} className="btn-ghost">复制</button>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={f.includeInLearning} onChange={() => toggleLearn(f)} /> 纳入学习库
                </label>
              </div>
            </>
          )}
        </div>
      ))}
```

替换为：

```tsx
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {list.map(f => (
          <div key={f.id} className="card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">
                {new Date(f.createdAt).toLocaleDateString()} · {f.subject}
              </span>
              <label className="text-xs flex items-center gap-1 text-text-muted">
                <input type="checkbox" checked={f.includeInLearning} onChange={() => toggleLearn(f)} /> 学习库
              </label>
            </div>
            {editId === f.id ? (
              <>
                <textarea className="input h-32" value={editText} onChange={e => setEditText(e.target.value)} />
                <button onClick={() => saveEdit(f.id!)} className="btn-ghost text-xs">保存</button>
              </>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">{f.finalText}</p>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => { setEditId(f.id!); setEditText(f.finalText); }} className="btn-ghost">编辑</button>
                  <button onClick={() => navigator.clipboard.writeText(f.finalText)} className="btn-ghost">复制</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
```

改动要点：
- 反馈列表包入 `grid grid-cols-1 lg:grid-cols-2 gap-3`
- 顶部行：日期+科目（左）+ 学习库勾选（右，移到右上角）
- 正文 `line-clamp-4` 限制 4 行预览
- 编辑/复制按钮 `text-sm` → `text-xs`
- `space-y-1` → `space-y-2`

- [ ] **Step 2: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add src/pages/StudentDetailPage.tsx && git commit -m "refactor(ui): 反馈列表 2 列网格+信息层次"
```

---

### Task 7: StatsPage 视觉升级 + StatCard 组件

**Files:**
- Create: `src/components/StatCard.tsx`
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: 创建 src/components/StatCard.tsx**

```tsx
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
```

- [ ] **Step 2: 修改 StatsPage.tsx**

将 `src/pages/StatsPage.tsx` 整体替换为：

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Zap, TrendingUp, Layers, Calendar } from "lucide-react";
import { getStats, Stats } from "../hooks/useStats";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { (async () => setS(await getStats()))(); }, []);
  if (!s) return <Skeleton lines={4} />;
  const max = Math.max(...s.recent7.map(d => d.tokens), 1);
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title text-xl font-bold">Token 消耗统计</h1>
      </div>

      {s.total === 0 ? (
        <EmptyState icon={BarChart3} title="暂无消耗数据" hint="生成反馈后这里会显示 Token 消耗" action={<Link to="/generate" className="btn-primary">去生成</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="总消耗" value={s.total} unit="tokens" icon={Zap} />
            <StatCard label="近 7 天" value={s.recent7.reduce((a, b) => a + b.tokens, 0)} unit="tokens" icon={TrendingUp} />
            <StatCard label="调用类型" value={Object.keys(s.byType).length} unit="类" icon={Layers} />
            <StatCard label="活跃天数" value={Object.keys(s.byDay).length} unit="天" icon={Calendar} />
          </div>

          <div className="card">
            <h2 className="section-title mb-4">近 7 天趋势</h2>
            <div className="flex items-end justify-between gap-2 h-32">
              {s.recent7.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-text-muted">{d.tokens}</div>
                  <div
                    className="w-full bg-primary rounded-t-md min-h-[4px] transition-all"
                    style={{ height: `${(d.tokens / max) * 100}%` }}
                    title={`${d.day}: ${d.tokens}`}
                  />
                  <div className="text-xs text-text-muted">{d.day.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">按调用类型</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(s.byType).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-2">
                  <span className="text-sm text-text">{k}</span>
                  <span className="text-sm font-semibold text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

改动要点：
- 新增 StatCard 组件，4 个指标卡：总消耗 / 近 7 天累计 / 调用类型数 / 活跃天数
- 柱状图：柱子 `rounded-t-md`，数字标注在柱子上方，日期在下方
- 按类型：从 `<ul>` 改为 `grid-cols-2 lg:grid-cols-3` 胶囊网格
- 移除"全部历史（按日期）"长列表
- EmptyState 用 BarChart3 图标
- 数据用现有 `s.total`/`s.recent7`/`s.byType`/`s.byDay`，不改 hook

- [ ] **Step 3: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add src/components/StatCard.tsx src/pages/StatsPage.tsx && git commit -m "refactor(ui): 统计页 4 列指标卡+优化柱状图+类型胶囊"
```

---

### Task 8: Skeleton + EmptyState 升级 + 最终验证

**Files:**
- Modify: `src/components/Skeleton.tsx`
- Modify: `src/components/EmptyState.tsx`

- [ ] **Step 1: 修改 Skeleton.tsx**

将 `src/components/Skeleton.tsx` 整体替换为：

```tsx
export function Skeleton({ lines = 3, avatar = false }: { lines?: number; avatar?: boolean }) {
  return (
    <div className="card space-y-3">
      {avatar && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 skeleton-shimmer rounded" />
            <div className="h-3 w-1/4 skeleton-shimmer rounded" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 skeleton-shimmer rounded ${i === lines - 1 ? "w-4/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
```

改动要点：
- 新增 `avatar` prop（默认 false）
- `bg-gray-200` → `bg-surface-2 skeleton-shimmer`（语义色 + shimmer 动画）
- avatar 模式渲染圆形头像骨架 + 两行文字骨架

- [ ] **Step 2: 修改 EmptyState.tsx**

将 `src/components/EmptyState.tsx` 整体替换为：

```tsx
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
```

改动要点：
- 删除 emoji `📭`
- 新增 `icon` prop（默认 Inbox），类型 `ComponentType<{ className?: string }>`
- 图标容器：`w-16 h-16 rounded-full bg-primary-surface`，图标 `w-8 h-8 text-primary`
- `text-gray-700`/`text-gray-500` → `text-text`/`text-text-muted`（语义色）
- `py-8` → `py-12`
- hint 加 `max-w-sm`

- [ ] **Step 3: 验证 build + 测试 + grep**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，79 测试全过

Run: `cd /workspace && grep -r "📭" src/ || echo "无 emoji 残留"`
Expected: 无 emoji 残留

Run: `cd /workspace && grep -r "max-w-content" src/ || echo "无 max-w-content 残留"`
Expected: 无 max-w-content 残留

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add src/components/Skeleton.tsx src/components/EmptyState.tsx && git commit -m "refactor(ui): Skeleton shimmer+avatar / EmptyState 参数化图标去 emoji"
```

---

## 完成后最终验证

- [ ] `npm run build` 成功
- [ ] `npm test` 79 测试全过
- [ ] grep 无 `📭` / `max-w-content` 残留
- [ ] 推送 + 线上验证
