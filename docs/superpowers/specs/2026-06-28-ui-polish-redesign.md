# UI 精致化重设计 Spec

> 日期：2026-06-28
> 状态：已与用户确认设计，待写实现计划
> 前置：主题系统重设计（已上线，commit `a864c56`）

## 1. 背景与目标

### 1.1 背景

主题系统重设计上线后，4 主题切换 + ClassFlow 品牌 + 衬线标题已落地。但用户反馈"排版布局还要优化"、"图标要好看"。诊断当前问题：

1. **页面宽度未约束**：内容可能撑满全屏，桌面端宽屏下行宽过长，阅读疲劳
2. **首页 hero 太单薄**：只有标题 + 一段文字，缺视觉重心和行动引导
3. **卡片网格千篇一律**：所有列表页都是简单堆叠，无信息层次
4. **导航栏信息密度低**：只有 logo + 纯文字链接 + 主题切换，空旷且无图标
5. **表单页布局松散**：表单字段直接堆叠，无分组视觉
6. **移动端体验粗糙**：导航栏在小屏拥挤，无汉堡菜单
7. **空状态/加载态简陋**：EmptyState 用 emoji，Skeleton 静态无动画
8. **favicon 简单**：当前是简单书本线条，缺精致感
9. **缺微交互**：卡片/按钮 hover 无反馈，导航无 hover 动效

### 1.2 目标

- **favicon 升级**：保留书本意象，优化几何 + 主色填充
- **最大宽度容器**：所有页面 max-w-5xl (1024px) 居中
- **首页 hero 重设计**：渐变背景 + 装饰圆 + CTA 按钮组
- **列表页网格优化**：学生 3 列 + 头像 + 信息层次；反馈 2 列 + 信息层次
- **表单页分区**：字段按逻辑分组（基本信息/学习情况/家长沟通），桌面端两列并排
- **导航栏增强**：sticky + 毛玻璃 + 7 项带图标 + 移动端汉堡菜单
- **StatsPage 重设计**：4 列指标卡 + 优化柱状图 + 学生排行 Top 5
- **Skeleton shimmer**：渐变动画 + avatar prop + 无障碍
- **EmptyState 插画化**：参数化 lucide 图标 + 圆形容器
- **微交互**：卡片 hover 上浮、按钮 hover 上浮、导航链接下划线动画、focus-visible 焦点环

### 1.3 非目标

- 不做路由懒加载（独立任务）
- 不改主题系统（已完成）
- 不改后端逻辑/AI 逻辑
- 不加新功能页面

## 2. favicon 升级

### 2.1 设计

保留书本意象，升级几何：

```svg
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="7" fill="#7a5c3e"/>
  <path d="M16 9 C 13 7, 9 7, 6 8 L 6 23 C 9 22, 13 22, 16 24" 
        fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M16 9 C 19 7, 23 7, 26 8 L 26 23 C 23 22, 19 22, 16 24" 
        fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="16" y1="9" x2="16" y2="24" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

- 外层圆角矩形（rx=7）用固定温暖棕 `#7a5c3e`（不随主题变，避免缓存问题）
- 书本轮廓用白色线条，居中对称
- 32×32 viewBox，适配各种尺寸
- 导航栏 logo 用同一个 SVG（通过 `import.meta.env.BASE_URL` 引用），`w-7 h-7`

## 3. 整体架构

### 3.1 最大宽度容器

在 App.tsx 主内容区包一层 `max-w-5xl mx-auto`：

```tsx
<main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  <Routes>...</Routes>
</main>
```

- `max-w-5xl` = 1024px，桌面端阅读舒适
- `px-4 sm:px-6 lg:px-8` 响应式水平 padding（16/24/32px）
- `py-6` 垂直 padding（24px）
- 导航栏也包同样容器，保持对齐
- 页面内部不再单独设 padding，由 main 容器统一控制
- 页面根元素用 `space-y-6` 控制区块间距

### 3.2 页面统一间距

- 页面区块间距：`space-y-6`（24px）
- 卡片内边距：`p-5`（20px，已由 .card class 定义）
- 卡片网格间距：`gap-4`（16px）

## 4. 首页 hero 重设计

### 4.1 hero 结构

```tsx
<section className="card hero-gradient relative overflow-hidden">
  {/* 装饰性背景圆 */}
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
```

### 4.2 hero-gradient CSS

```css
.hero-gradient {
  background: linear-gradient(135deg, 
    rgb(var(--primary) / 0.08) 0%, 
    rgb(var(--primary-surface) / 0.5) 100%);
}
```

### 4.3 改动要点

- `.hero-gradient` 主色渐变背景，切主题时颜色跟着变
- 两个装饰性背景圆（`bg-primary/5`），增加视觉层次但不抢主色
- `relative overflow-hidden` 让装饰圆被卡片裁切
- 标题响应式：`text-3xl sm:text-4xl`
- 段落加 `max-w-2xl` 限制行宽
- 新增 CTA 按钮组："立即生成反馈"（主按钮）+ "管理学生"（次按钮）

## 5. 列表页网格优化

### 5.1 学生列表页（StudentsPage）

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {students.map(s => (
    <div key={s.id} className="card card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary-surface text-primary 
                          flex items-center justify-center font-semibold">
            {s.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text truncate">{s.name}</h3>
            <p className="text-xs text-text-muted">{s.grade}</p>
          </div>
        </div>
        <span className="shrink-0 badge bg-primary-surface text-primary text-xs px-2 py-0.5 rounded-md">
          {s.subject}
        </span>
      </div>
      {s.weakness && (
        <p className="mt-3 text-sm text-text-muted line-clamp-2">{s.weakness}</p>
      )}
    </div>
  ))}
</div>
```

- 网格 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`（1/2/3 列）
- 头像：学生姓首字母 + 主色 surface 圆形
- 信息层次：姓名（大）/ 年级（小）/ 科目（徽章）/ 薄弱点（2 行截断）
- 科目徽章用 `bg-primary-surface text-primary`
- `line-clamp-2` 限制薄弱点显示行数

### 5.2 反馈列表页（FeedbacksPage）

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {feedbacks.map(f => (
    <div key={f.id} className="card card-hover">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-text truncate">{f.studentName}</span>
          <span className="text-xs text-text-muted">{formatDate(f.createdAt)}</span>
        </div>
        <span className="badge bg-primary-surface text-primary text-xs px-2 py-0.5 rounded-md">
          {f.subject}
        </span>
      </div>
      <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">{f.content}</p>
    </div>
  ))}
</div>
```

- 反馈内容多，用 `grid-cols-1 lg:grid-cols-2`（1/2 列）
- `line-clamp-3` 限制内容预览 3 行

## 6. 表单页分组

### 6.1 学生编辑页（StudentFormPage）

```tsx
<div className="space-y-6">
  <div className="page-header">
    <h1 className="page-title text-xl font-bold">{id ? "编辑学生" : "添加学生"}</h1>
  </div>

  <div className="card space-y-4">
    <h2 className="section-title">基本信息</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="form-field">
        <label className="label">姓名</label>
        <input className="input" ... />
      </div>
      <div className="form-field">
        <label className="label">年级</label>
        <input className="input" ... />
      </div>
    </div>
    <div className="form-field">
      <label className="label">常用科目</label>
      <input className="input" ... />
    </div>
  </div>

  <div className="card space-y-4">
    <h2 className="section-title">学习情况</h2>
    <div className="form-field">
      <label className="label">性格特点</label>
      <textarea className="input" rows={2} ... />
    </div>
    <div className="form-field">
      <label className="label">薄弱点</label>
      <textarea className="input" rows={2} ... />
    </div>
  </div>

  <div className="card space-y-4">
    <h2 className="section-title">家长沟通</h2>
    <div className="form-field">
      <label className="label">家长关注点</label>
      <textarea className="input" rows={2} ... />
    </div>
  </div>

  <div className="flex gap-2">
    <button className="btn-primary px-4 py-2">保存</button>
    <Link to="/students" className="btn-soft px-4 py-2">取消</Link>
  </div>
</div>
```

- 三组分区卡片：基本信息 / 学习情况 / 家长沟通
- 每个分区是独立 `.card`，用 `.section-title` 标题
- 基本信息内字段用 `grid-cols-1 sm:grid-cols-2`，桌面端两列并排
- 长文本字段用 `textarea rows={2}`
- 操作按钮组独立于卡片外

### 6.2 规范档编辑页（SpecFormPage）

类似分组：基本信息 / 规范内容。具体字段按现有结构组织。

### 6.3 字段迁移要求

重新组织字段分组时，不能丢失任何现有字段。实现时必须先 Read 当前文件，确认所有字段都迁移到新分组。

## 7. 导航栏增强

### 7.1 结构

```tsx
<header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="h-14 flex items-center justify-between gap-4">
      <NavLink to="/" className="flex items-center gap-2 font-bold text-text shrink-0">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
        <span className="hidden sm:inline">ClassFlow · 课后反馈</span>
      </NavLink>
      
      <nav className="hidden sm:flex items-center gap-1">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive}) => 
            clsx("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")}>
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button onClick={() => setMobileOpen(!mobileOpen)} 
                className="sm:hidden btn-ghost p-2" aria-label="菜单" aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
    </div>
    
    {mobileOpen && (
      <nav className="sm:hidden pb-3 flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                   className={({isActive}) => 
            clsx("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")}>
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    )}
  </div>
</header>
```

### 7.2 NAV_ITEMS 常量

新建 `src/data/nav.ts`：

```tsx
import { Home, Users, BookOpen, Sparkles, FileText, BarChart3, Settings } from "lucide-react";
import { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "首页", icon: Home },
  { to: "/students", label: "学生", icon: Users },
  { to: "/spec", label: "规范档", icon: BookOpen },
  { to: "/generate", label: "生成", icon: Sparkles },
  { to: "/feedbacks", label: "反馈", icon: FileText },
  { to: "/stats", label: "统计", icon: BarChart3 },
  { to: "/settings", label: "设置", icon: Settings },
];
```

### 7.3 改动要点

- sticky 顶栏：`sticky top-0 z-40`
- 毛玻璃背景：`bg-surface/80 backdrop-blur`
- 导航项配 lucide 图标（7 项）
- 移动端汉堡菜单：< 640px 隐藏桌面导航，显示汉堡按钮
- 导航栏容器用 `max-w-5xl mx-auto`，和主内容对齐
- 移动端 logo 文字 `hidden sm:inline`
- 路由切换时关闭移动端菜单

## 8. StatsPage 重设计

### 8.1 结构

```tsx
<div className="space-y-6">
  <div className="page-header">
    <h1 className="page-title text-xl font-bold">统计</h1>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <StatCard label="学生总数" value={stats.totalStudents} icon={Users} />
    <StatCard label="反馈总数" value={stats.totalFeedbacks} icon={FileText} />
    <StatCard label="本周生成" value={stats.weekCount} icon={Sparkles} />
    <StatCard label="本月生成" value={stats.monthCount} icon={Calendar} />
  </div>

  <div className="card">
    <h2 className="section-title mb-4">近 7 天生成趋势</h2>
    <div className="flex items-end justify-between gap-2 h-32">
      {stats.recent7.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs text-text-muted">{d.count}</div>
          <div 
            className="w-full bg-primary rounded-t-md min-h-[4px] transition-all"
            style={{ height: `${(d.count / maxCount) * 100}%` }}
          />
          <div className="text-xs text-text-muted">{d.label}</div>
        </div>
      ))}
    </div>
  </div>

  <div className="card">
    <h2 className="section-title mb-4">学生反馈排行</h2>
    <div className="space-y-2">
      {stats.topStudents.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 py-2">
          <span className="shrink-0 w-6 h-6 rounded-md bg-primary-surface text-primary 
                           text-xs font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <span className="flex-1 text-text">{s.name}</span>
          <span className="text-sm text-text-muted">{s.count} 条</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

### 8.2 StatCard 子组件

新建 `src/components/StatCard.tsx`：

```tsx
import { ComponentType } from "react";

export function StatCard({ label, value, icon: Icon }: { 
  label: string; value: number; icon: ComponentType<{ className?: string }> 
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary-surface flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
```

### 8.3 useStats 升级

新增 `topStudents` 字段：

```ts
interface TopStudent {
  id: string;
  name: string;
  count: number;
}

interface Stats {
  // ... 现有字段
  topStudents: TopStudent[];  // 按反馈数降序，limit 5
}
```

计算逻辑：按 studentId group + count + sort desc + limit 5。

## 9. Skeleton + EmptyState 升级

### 9.1 Skeleton shimmer

```tsx
// src/components/Skeleton.tsx
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

CSS：
```css
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
```

- 新增 `avatar` prop
- `.skeleton-shimmer` 用语义色变量
- `prefers-reduced-motion` 无障碍

### 9.2 EmptyState 插画化

```tsx
// src/components/EmptyState.tsx
import { ReactNode, ComponentType } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ 
  title, hint, action, icon: Icon = Inbox 
}: { 
  title: string; 
  hint?: string; 
  action?: ReactNode; 
  icon?: ComponentType<{ className?: string }> 
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

- 图标参数化：默认 `Inbox`，调用方可传其他 lucide 图标
- 圆形容器：`w-16 h-16` + 主色 surface 背景 + 主色图标
- `py-12` 垂直留白
- hint 加 `max-w-sm` 限制宽度

## 10. 微交互

### 10.1 CSS（加到 index.css）

```css
/* 卡片悬停上浮 */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--primary) / 0.4);
  box-shadow: 0 2px 4px rgb(var(--primary) / 0.06),
              0 8px 24px -6px rgb(var(--primary) / 0.12);
}

/* 按钮悬停（btn-primary 已有，强化） */
.btn-primary {
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
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

/* 主题色卡 hover 放大 */
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

## 11. 移动端响应式

### 11.1 断点策略

- `< 640px`（sm 以下）：移动端，单列布局，汉堡菜单
- `640px-1024px`（sm-lg）：平板，2 列网格
- `>= 1024px`（lg 以上）：桌面，3 列网格，表单两列并排

### 11.2 具体处理

- 导航栏：< 640px 汉堡菜单
- 学生列表：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- 反馈列表：`grid-cols-1 lg:grid-cols-2`
- 表单基本信息：`grid-cols-1 sm:grid-cols-2`
- 统计指标卡：`grid-cols-2 lg:grid-cols-4`
- StatsPage 表格：小屏下 `overflow-x-auto`

## 12. 测试策略

### 12.1 TDD（纯逻辑层）

`useStats` 升级测试（tests/hooks/useStats.test.ts 加用例）：
- 按学生 group + count
- sort desc by count
- limit 5
- 空数据返回 `[]`

### 12.2 tsc + build 验证（UI 层）

- Skeleton 升级：avatar prop 渲染头像骨架
- EmptyState 升级：参数化图标渲染
- StatCard 组件：渲染 label/value/icon
- 导航栏移动端菜单：汉堡按钮点击展开/收起

### 12.3 回归验证

- 全量 79 测试不回归
- grep 确认无 emoji 残留（EmptyState 不再用 `📭`）

## 13. 体积影响

**新增**：
- favicon.svg（~0.5kb，不打入 JS bundle，不增加 gzip）
- hero-gradient/shimmer/微交互 CSS（~1kb gzip）
- StatCard 组件 + nav.ts（~1kb gzip）
- topStudents 逻辑（~0.5kb gzip）

**净增**：约 2.5kb gzip。当前 146.36kb → 预计 ~149kb。

## 14. 风险与边界

1. **sticky 导航栏 + 毛玻璃**：`backdrop-blur` 在老浏览器不支持，降级为纯色背景。现代浏览器无问题。

2. **移动端汉堡菜单**：用条件渲染（`{mobileOpen && ...}`）而非 HeadlessUI Disclosure。路由切换时手动关闭菜单（`onClick={() => setMobileOpen(false)}`）。已处理。

3. **line-clamp 兼容性**：Tailwind 3.4 内置 `line-clamp-*`，无需插件，现代浏览器支持。无风险。

4. **prefers-reduced-motion**：Skeleton shimmer 在用户系统设置"减少动效"时禁用。已处理。

5. **favicon 缓存**：favicon 用固定温暖棕 `#7a5c3e`，不随主题变。浏览器对 favicon 缓存激进，用户可能需要强制刷新才能看到新 favicon。可接受。

6. **StatsPage topStudents 依赖 useStats**：需要确认现有 useStats 的数据结构能支持 group by student。Task 6 TDD 时验证。

7. **表单页分区可能影响现有字段**：StudentFormPage 重新组织字段分组时，不能丢失任何现有字段。Task 5 必须先 Read 当前文件，确认所有字段都迁移到新分组。

8. **导航栏图标增加宽度**：7 项 + 图标在桌面端可能拥挤。`max-w-5xl` 1024px 下应能容纳，但需实际验证。如果拥挤可去掉部分图标或缩短 label。

## 15. 实施顺序（8 Task）

| Task | 内容 | 依赖 |
|---|---|---|
| 1 | favicon.svg 升级 | 无 |
| 2 | index.css 加 hero-gradient + shimmer + 微交互 + focus-visible | 无 |
| 3 | App.tsx max-w-5xl + 导航栏 sticky/毛玻璃/图标/汉堡菜单 + nav.ts | Task 2 |
| 4 | HomePage hero 重设计 | Task 2 |
| 5 | 列表页 + 表单页布局（Students/Feedbacks/StudentForm/SpecForm） | Task 2 |
| 6 | StatsPage 重设计 + StatCard + useStats topStudents（TDD） | Task 2 |
| 7 | Skeleton + EmptyState 升级 | Task 2 |
| 8 | 最终验证 + grep + 推送 | 全部 |

## 16. 验收标准

- [ ] favicon 升级为带主色背景的书本图标
- [ ] 所有页面内容在 max-w-5xl 容器内居中
- [ ] 导航栏 sticky + 毛玻璃 + 7 项带图标
- [ ] 移动端 < 640px 显示汉堡菜单
- [ ] 首页 hero 有渐变背景 + 装饰圆 + CTA 按钮组
- [ ] 学生列表 3 列网格 + 头像 + 信息层次
- [ ] 反馈列表 2 列网格 + 信息层次
- [ ] 学生编辑表单分 3 区卡片 + 基本信息两列
- [ ] 规范档编辑表单分区卡片
- [ ] 统计页 4 列指标卡 + 优化柱状图 + 学生排行 Top 5
- [ ] Skeleton 支持 avatar prop + shimmer 动画
- [ ] EmptyState 参数化图标 + 圆形容器
- [ ] 卡片 hover 上浮 2px + 阴影加深
- [ ] 导航链接 hover 下划线动画
- [ ] 按钮 hover 上浮 1px
- [ ] 键盘 focus-visible 焦点环
- [ ] prefers-reduced-motion 禁用 shimmer
- [ ] 全量测试通过，build 成功
- [ ] 线上验证所有视觉点
