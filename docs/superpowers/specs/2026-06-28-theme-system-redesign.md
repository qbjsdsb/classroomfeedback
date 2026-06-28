# 主题系统重设计 Spec

> 日期：2026-06-28
> 状态：已与用户确认设计，待写实现计划
> 前置：UI 统一与暗色模式（Task 1-8 已完成，commit `5641f98`）

## 1. 背景与目标

### 1.1 背景

上一轮（Task 1-8）完成了颜色统一和暗色模式，引入 CSS 变量语义色 + `darkMode: "class"` + HeadlessUI Listbox/Dialog + lucide 图标。但用户反馈"还是很丑"，诊断出三个核心问题：

1. **颜色太单调/冷淡**：全 Tailwind 默认蓝（#2563eb）+ 纯灰阶，无辅助色，无温度，像后台管理系统
2. **排版/字体没质感**：全用系统 sans-serif，标题正文同字族，字重只有 400/600 两档
3. **缺乏品牌感/个性**：像通用模板，没有教育产品的温暖感和识别度

用户还要求"可以自己切换颜色"，且面向桌面端使用。

### 1.2 目标

- 提供 **4 个预设主题**（温暖棕 / 知性蓝 / 自然绿 / 典雅紫），用户可在设置页切换
- **主题 + 明暗独立切换**：每个主题有明暗两版，用户选主题 + 选明暗（浅色/深色/跟随系统）
- **主色 + 背景基调都随主题变**：不只是换主色，背景/表面/边框/文字都带主题色相倾向
- **提升排版质感**：衬线标题 + 字重层次 + 大圆角 + 主色 tint 阴影 + 宽松间距
- **建立品牌识别**：品牌名 ClassFlow + hero eyebrow 标签
- **桌面端优先**：间距和字号适配桌面阅读
- **不引入字体文件**：衬线字体依赖系统，0 体积成本
- **体积可控**：净增 ~2.5kb gzip

### 1.3 非目标

- 不做自定义色相滑块（用户选预设主题切换）
- 不做主题色 + 辅助色的全自定义（辅助色 success/danger/warning 跨主题统一）
- 不处理 Task 8 引入的 HeadlessUI Listbox 体积问题（独立任务）
- 不引入字体文件打包（依赖系统字体）

## 2. 整体架构

### 2.1 核心机制

CSS 变量 + `data-theme` 属性驱动，零运行时开销：

```html
<html data-theme="warm" class="dark">
  <!-- data-theme 选主题，class="dark" 控明暗 -->
</html>
```

```css
/* 主题定义主色 + 背景基调 */
[data-theme="warm"] {
  --primary: 122 92 62;       /* 棕褐 */
  --bg: 250 247 242;          /* 暖米白 */
  --surface: 255 250 243;     /* 奶白 */
  ...
}
[data-theme="warm"].dark {
  --bg: 28 22 18;             /* 深咖背景 */
  --primary: 200 150 100;     /* 浅金棕（暗色提亮） */
  ...
}
```

### 2.2 状态管理

`useTheme` hook 升级，返回主题 + 明暗两个独立维度：

```ts
type ThemeName = "warm" | "blue" | "green" | "purple";
type Mode = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: ThemeName;                   // 当前主题
  mode: Mode;                         // 明暗模式选择
  resolvedMode: "light" | "dark";     // 实际生效的明暗（system 解析后）
  setTheme: (t: ThemeName) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;             // 导航栏快捷切换：light↔dark
}
```

### 2.3 存储

localStorage 两个 key：
- `cf-theme`：主题名（`"warm"` / `"blue"` / `"green"` / `"purple"`）
- `cf-mode`：明暗模式（`"light"` / `"dark"` / `"system"`）

用 `cf-` 前缀避免和旧 `theme` key 冲突，简化迁移。

### 2.4 入口

- **设置页**：新增"外观"区块（主题选择器 + 明暗三态切换）
- **导航栏**：右上角 ThemeToggle 按钮保留，只切换明暗（light↔dark），不切换主题

## 3. 四主题色板

每个主题定义 9 个语义变量，明暗各一套。色值用 `R G B` 空格分隔（配合 tailwind 的 `rgb(var(--x) / <alpha-value>)`）。

### 3.1 主题 1：温暖棕 `warm`（书卷气、有温度）

```css
[data-theme="warm"] {
  --bg: 250 247 242;        /* 暖米白 */
  --surface: 255 250 243;   /* 奶白 */
  --surface-2: 243 233 216; /* 浅米 */
  --border: 236 229 216;    /* 米灰 */
  --text: 61 44 30;         /* 深咖 */
  --text-muted: 138 122 102;/* 暖灰 */
  --primary: 122 92 62;     /* 棕褐 */
  --primary-hover: 160 125 86;
  --primary-surface: 243 233 216;
}
[data-theme="warm"].dark {
  --bg: 28 22 18;           /* 深咖背景 */
  --surface: 42 33 26;      /* 深棕表面 */
  --surface-2: 58 46 36;    /* 中棕 */
  --border: 74 58 46;       /* 棕边框 */
  --text: 240 232 220;      /* 暖白 */
  --text-muted: 184 168 148;
  --primary: 200 150 100;   /* 浅金棕（暗色提亮） */
  --primary-hover: 220 175 125;
  --primary-surface: 74 54 38;
}
```

### 3.2 主题 2：知性蓝 `blue`（专业、清爽）

```css
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
```

### 3.3 主题 3：自然绿 `green`（清新、成长感）

```css
[data-theme="green"] {
  --bg: 247 250 247;
  --surface: 255 255 255;
  --surface-2: 237 242 237;
  --border: 223 231 223;
  --text: 30 41 30;
  --text-muted: 100 116 100;
  --primary: 22 101 52;     /* 深森林绿 */
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
  --primary: 134 200 150;   /* 浅嫩绿（暗色提亮） */
  --primary-hover: 170 220 180;
  --primary-surface: 30 58 38;
}
```

### 3.4 主题 4：典雅紫 `purple`（优雅、创意）

```css
[data-theme="purple"] {
  --bg: 250 248 252;
  --surface: 255 255 255;
  --surface-2: 243 240 248;
  --border: 229 224 238;
  --text: 41 30 61;
  --text-muted: 116 100 139;
  --primary: 126 87 194;    /* 雅紫（非刺眼紫） */
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
```

### 3.5 设计原则

- **暗色模式主色统一提亮**（更浅），保证暗背景下可读性和视觉吸引力
- **每个主题的 `--bg` 带色相倾向**（warm 偏暖、green 偏绿等），不是纯灰——这是"背景基调也变"的实现
- **`--text` 也带主题色相倾向**（warm 是深咖不是黑，green 是深绿灰不是黑）
- **辅助色跨主题统一**：success（emerald-600）、danger（red-600）、warning（amber）不随主题变，避免过度复杂

## 4. 排版与组件质感

### 4.1 字体系统

```css
body {
  font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei",
    -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-feature-settings: "tnum"; /* 数字等宽，统计页对齐 */
}

/* 标题用衬线感，带书卷气 */
h1, .h1, .page-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC",
    "PingFang SC", serif;
  letter-spacing: -0.2px;
}
```

**取舍**：标题衬线字体带来"书卷气、有温度"。**不打包字体文件**，依赖系统衬线字体（macOS 有 Songti SC，Windows 有 SimSun，iOS 有 Noto Serif SC）。系统无衬线字体时回退到无衬线，不会破。0 体积成本。

### 4.2 字重层次

```
页面大标题 h1:    28px / 700 / 衬线 / letter-spacing -0.2px
区块标题 h2:      18px / 600 / 无衬线
卡片标题 h3:      15px / 600 / 无衬线
正文 body:        14px / 400 / 无衬线 / line-height 1.65
辅助 hint:        12px / 400 / text-muted / line-height 1.5
```

现状是全 400/600 两档，新方案拉大到 400/600/700 三档 + 衬线对比，层次明显。

### 4.3 圆角

```css
.card      { border-radius: 14px; }   /* 原 8px → 14px，更柔和 */
.btn       { border-radius: 8px; }    /* 原 6px → 8px */
.input     { border-radius: 8px; }    /* 原 6px → 8px */
.badge     { border-radius: 10px; }   /* 序号徽章原圆形改圆角方 */
```

### 4.4 阴影（主色 tint）

```css
.card {
  box-shadow: 0 1px 2px rgb(var(--primary) / 0.04),
              0 4px 12px -4px rgb(var(--primary) / 0.08);
}
.card-hover:hover {
  box-shadow: 0 2px 4px rgb(var(--primary) / 0.06),
              0 8px 24px -6px rgb(var(--primary) / 0.12);
}
```

阴影用 `rgb(var(--primary) / ...)` 而非纯黑，不同主题下阴影带各自色相倾向（warm 阴影偏棕、green 偏绿），整体更协调。

### 4.5 间距系统（桌面端宽松）

```
卡片内边距:    p-4(16px) → p-5(20px)
卡片间距:      gap-3(12px) → gap-4(16px)
页面区块间距:  space-y-6(24px) → space-y-8(32px)
hero 内边距:   p-5(20px) → p-6(24px)
```

让内容"呼吸"，解决"太满/拥挤"。

### 4.6 按钮质感

```css
.btn-primary {
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
```

### 4.7 品牌识别

- 导航栏 logo 区：`ClassFlow · 课后反馈`
- hero 区加 eyebrow 小标签：`FOR EDUCATORS`（11px 大写字母间距 2px，次文色）
- favicon 保持现有书本图标

## 5. 设置页外观区块

### 5.1 布局

在设置页顶部（API Key 区块之前）加"外观"区块：

```
┌─ 外观 ─────────────────────────────────┐
│                                         │
│  主题                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 温暖 │ │ 知性 │ │ 自然 │ │ 典雅 │      │
│  │ 棕  │ │ 蓝  │ │ 绿  │ │ 紫  │      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│  ● 当前选中: 温暖棕                      │
│                                         │
│  明暗模式                               │
│  [ ☀️ 浅色 ] [ 🌙 深色 ] [ 🖥 跟随系统 ]  │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 主题选择器

4 个色卡（ThemeCard 组件），每个色卡显示主题主色色块 + 名称。点击切换，实时预览（不用刷新）。当前选中的色卡有主色边框 + 角标。

### 5.3 明暗模式

三态切换（浅色 / 深色 / 跟随系统），取代现在的二态 toggle。

## 6. useTheme 升级

### 6.1 接口

```ts
type ThemeName = "warm" | "blue" | "green" | "purple";
type Mode = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: ThemeName;
  mode: Mode;
  resolvedMode: "light" | "dark";
  setTheme: (t: ThemeName) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
}
```

### 6.2 system 模式行为

- `mode === "system"` 时，监听 `matchMedia("(prefers-color-scheme: dark)")` 的 change 事件
- `resolvedMode` = matchMedia.matches ? "dark" : "light"
- 实际给 `<html>` 加/移除 `dark` class 用 `resolvedMode`

### 6.3 toggleMode 行为

导航栏 ThemeToggle 调用：
- light → dark
- dark → light
- system → 切换到明确的 light/dark（脱离跟随系统，按当前 resolvedMode 的反值）

## 7. 迁移策略

### 7.1 老用户兼容

老用户之前 localStorage `theme` key 存的是 `"light"` / `"dark"`。迁移逻辑：

```ts
function migrate() {
  const oldMode = localStorage.getItem("theme");
  if (oldMode === "light" || oldMode === "dark") {
    localStorage.setItem("cf-mode", oldMode);
    localStorage.removeItem("theme");
  }
  // cf-theme 不存在时默认 "warm"（让老用户看到新面貌）
}
```

### 7.2 默认值

- 无 `cf-theme`：默认 `"warm"`（温暖棕）——让老用户第一眼看到新面貌
- 无 `cf-mode`：默认 `"system"`（跟随系统）

### 7.3 无 FOUC inline script

```html
<script>
  (function () {
    // 迁移旧 key
    var old = localStorage.getItem("theme");
    if (old === "light" || old === "dark") {
      localStorage.setItem("cf-mode", old);
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

## 8. 导航栏 ThemeToggle 改造

现有 ThemeToggle 是 light↔dark 二态。改造为：
- 点击切换 `resolvedMode`（light→dark 或 dark→light）
- 如果当前 `mode === "system"`，点击后设为明确的 light/dark（脱离跟随系统）
- 图标：dark 时显示 Sun（点击转浅）、light 时显示 Moon（点击转深）

## 9. 测试策略

### 9.1 TDD（纯逻辑层）

`useTheme` 升级测试（tests/hooks/useTheme.test.ts 重写）：
- 主题读写：setTheme 写 localStorage `cf-theme` + 设置 `data-theme` 属性
- 明暗三态：setMode("system") 监听 matchMedia；resolvedMode 正确解析
- toggleMode：light↔dark；system 时按 resolved 切换并脱离 system
- 迁移：旧 `theme` key 存 "light" 时，初始化后迁移到 `cf-mode` 并删旧 key
- 默认值：无 localStorage 时 theme="warm"、mode="system"

### 9.2 tsc + build 验证（UI 层）

- ThemeCard 组件：渲染 4 个色卡，点击触发 setTheme
- 设置页外观区块：4 主题 + 3 明暗模式渲染正确
- 导航栏 ThemeToggle：图标随 resolvedMode 变化

### 9.3 回归验证

- 全量 72 测试不回归（CSS 变量改动不影响逻辑测试）
- grep 确认无残留旧 key（`localStorage.getItem("theme")` 只能在迁移代码里出现一次）

## 10. 体积影响

**新增**：
- 4 主题 × 2 明暗 = 8 套 CSS 变量定义（~1.5kb gzip）
- ThemeCard 组件 + 设置页外观区块（~1kb gzip）
- useTheme 升级（~0.5kb gzip）

**删除**：
- 原 `:root` / `.dark` 单套变量（~0.5kb）

**净增**：约 2.5kb gzip。当前 145.42kb → 预计 ~148kb。

**不引入字体文件**：衬线字体依赖系统，0 体积成本。

**体积仍在 115kb 目标之外**：这是 Task 8 引入 HeadlessUI Listbox 的成本，与本次主题系统无关。路由懒加载优化作为独立任务，不混入本次。

## 11. 风险与边界

1. **迁移边界**：老用户首次访问执行迁移。如果用户在迁移瞬间刷新，inline script 会再次检测旧 key 已删除，走默认值——不会出错。

2. **system 模式 + 主题切换**：用户选 system 模式时操作系统切换明暗，应用实时跟随（matchMedia change 事件）。预期行为，无风险。

3. **CSS 变量兼容性**：`data-theme` 属性选择器 + CSS 变量，所有现代浏览器支持，IE 不支持（项目本来就只支持现代浏览器，无影响）。

4. **衬线字体回退**：Windows 无 Noto Serif SC 时回退到 SimSun（宋体），SimSun 在小字号下略糙但可读。macOS/iOS 体验最佳。已知 trade-off，已确认接受。

5. **Tailwind purge**：新加的 `data-theme` 选择器在 CSS 文件里（非 class），Tailwind 不会 purge 掉。需确认 `tailwind.config.js` 的 content 仍包含 `./src/**/*.{ts,tsx}` 和 `./src/index.css`（index.css 自身不会被 purge）。

6. **暗色模式阴影可见性**：暗色背景下阴影本就难看见。用 `rgb(var(--primary) / 0.08)` 带主色 tint 的阴影，在暗色下仍能提供微弱层次。**如果暗色下阴影完全不可见，改用 `border` + `brightness` 区分层级**——实现时按实际效果微调。

## 12. 实施顺序

本次工作大致分 4 块（具体 Task 在 writing-plans 阶段拆）：

1. **基础**：tailwind.config 不变（已映射变量），index.css 替换为 4 主题 × 2 明暗变量 + 排版/圆角/阴影组件层
2. **useTheme 升级（TDD）**：4 主题 + 3 明暗 + 迁移
3. **ThemeCard 组件 + 设置页外观区块**
4. **导航栏 ThemeToggle 改造 + 全局回归**

## 13. 验收标准

- [ ] 设置页可切换 4 个主题，实时预览
- [ ] 设置页可切换 3 种明暗模式（浅色/深色/跟随系统）
- [ ] 主题 + 明暗组合共 8 种，视觉都正确（主色、背景、文字、边框、阴影）
- [ ] 刷新页面主题和明暗保持
- [ ] 老用户（旧 `theme` key）首次访问自动迁移，默认 warm 主题
- [ ] 无 FOUC（刷新瞬间无闪烁）
- [ ] 标题用衬线字体（macOS 可见），字重层次明显
- [ ] 卡片圆角 14px，按钮 8px，阴影带主色 tint
- [ ] 间距比现状宽松（p-5/gap-4/space-y-8）
- [ ] 导航栏显示 "ClassFlow · 课后反馈"
- [ ] hero 区有 eyebrow 标签
- [ ] 导航栏 ThemeToggle 点击 light↔dark 切换
- [ ] 全量测试通过，build 成功
- [ ] grep 无残留旧 key（迁移代码除外）
