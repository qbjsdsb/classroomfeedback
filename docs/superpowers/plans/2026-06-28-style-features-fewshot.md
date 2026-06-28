# 风格特征 + Few-shot 对照 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在规范档新增 7 维风格特征（4 数值 + 3 文本），生成时用词频相似度检索最相似的 top 5 历史反馈作为 few-shot 示例，实现"识别更精准、生成更一致"。

**Architecture:** 纯前端 Jaccard 加权相似度（0 依赖、0 API 成本），learn 时 AI 自动归纳 styleFeatures，generate 时注入 few-shot 示例 + 风格特征强约束。db v2→v3 迁移给旧规范档补默认 styleFeatures。

**Tech Stack:** TypeScript + React + Dexie.js + DeepSeek API，无新增依赖

---

## File Structure

| 文件 | 责任 | 改动 |
|---|---|---|
| `src/ai/similarity.ts` | 词频重叠相似度 + topN 检索 | 新建 |
| `tests/ai/similarity.test.ts` | similarity 单元测试 | 新建 |
| `src/types/index.ts` | 加 StyleFeatures 接口 + SpecProfile 加字段 | 修改 |
| `src/db/schema.ts` | v2→v3 迁移 | 修改 |
| `src/db/seed.ts` | 内置规范档预填 styleFeatures | 修改 |
| `src/hooks/useSpecProfiles.ts` | createProfile/relearn 处理 styleFeatures | 修改 |
| `src/ai/prompts.ts` | learnPrompt 输出 styleFeatures；generatePrompt 注入 few-shot + styleFeatures | 修改 |
| `src/ai/learn.ts` | 解析 styleFeatures + 防御补默认 | 修改 |
| `tests/ai/learn.test.ts` | styleFeatures 解析测试 | 新建 |
| `src/hooks/useFeedbacks.ts` | 加 listFeedbacksForFewShot | 修改 |
| `src/ai/generate.ts` | 调 similarity + 注入 few-shot | 修改 |
| `src/pages/SpecProfilePage.tsx` | 风格特征区块 UI | 修改 |
| `src/pages/GeneratePage.tsx` | 改用 listFeedbacksForFewShot | 修改 |

---

### Task 1: similarity.ts + 测试（TDD 纯逻辑）

**Files:**
- Create: `src/ai/similarity.ts`
- Test: `tests/ai/similarity.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/ai/similarity.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { similarity, selectTopN } from "../../src/ai/similarity";

describe("similarity", () => {
  it("完全相同返回 1", () => {
    expect(similarity("今天学了数学应用题", "今天学了数学应用题")).toBe(1);
  });

  it("完全无重叠返回 0", () => {
    expect(similarity("今天学了数学", "abcdefg")).toBe(0);
  });

  it("空字符串返回 0", () => {
    expect(similarity("", "今天")).toBe(0);
    expect(similarity("今天", "")).toBe(0);
    expect(similarity("", "")).toBe(0);
  });

  it("停用词不影响相似度", () => {
    // "的了的"被过滤，"数学应用"才是有效 token
    expect(similarity("数学应用题", "数学应用题的")).toBeGreaterThan(0.9);
  });

  it("部分重叠返回 0-1 之间", () => {
    const s = similarity("今天学数学应用题", "明天学语文阅读理解");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it("英文/数字也参与相似度", () => {
    expect(similarity("学了 Chapter 3", "复习 Chapter 3")).toBeGreaterThan(0);
  });
});

describe("selectTopN", () => {
  const candidates = [
    { id: 1, text: "今天学了数学应用题", studentId: 10, subject: "数学" },
    { id: 2, text: "复习语文古诗词", studentId: 20, subject: "语文" },
    { id: 3, text: "数学函数练习", studentId: 10, subject: "数学" },
    { id: 4, text: "英语听力训练", studentId: 30, subject: "英语" },
  ];

  it("按分数降序取 topN", () => {
    const result = selectTopN("数学应用题", candidates, { topN: 2 });
    expect(result.length).toBe(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it("score > 0 过滤", () => {
    // "数学应用题" 和 "英语听力训练" 无中文重叠
    const result = selectTopN("数学应用题", candidates, { topN: 10 });
    expect(result.every(r => r.score > 0)).toBe(true);
  });

  it("preferSameStudent 加权", () => {
    // 学生 20 的反馈（"复习语文古诗词"）和查询 "数学应用题" 相似度低
    // 但加 preferSameStudent=20 后应被加权选中
    const withoutPref = selectTopN("数学应用题", candidates, { topN: 10, preferSameStudent: undefined });
    const withPref = selectTopN("数学应用题", candidates, { topN: 10, preferSameStudent: 20 });
    const id20Without = withoutPref.find(r => r.id === 2);
    const id20With = withPref.find(r => r.id === 2);
    expect(id20With!.score).toBeGreaterThan(id20Without!.score);
  });

  it("preferSameSubject 加权", () => {
    const withoutPref = selectTopN("应用题", candidates, { topN: 10, preferSameSubject: undefined });
    const withPref = selectTopN("应用题", candidates, { topN: 10, preferSameSubject: "数学" });
    // 学生 10 的两条都是数学，应被加权
    expect(withPref[0].score).toBeGreaterThanOrEqual(withoutPref[0].score);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /workspace && npx vitest run tests/ai/similarity.test.ts`
Expected: FAIL with "Cannot find module '../../src/ai/similarity'"

- [ ] **Step 3: 实现 similarity.ts**

创建 `src/ai/similarity.ts`：

```ts
// src/ai/similarity.ts
// 词频重叠相似度（Jaccard 加权）+ topN 检索
// 纯前端 0 依赖，0 API 成本

/** 中文分词：2-3 字滑窗 + 英文/数字词 */
function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens: string[] = [];
  const cjkRegex = /[\u4e00-\u9fa5]+/g;
  const wordRegex = /[a-zA-Z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = cjkRegex.exec(text)) !== null) {
    const seg = m[0];
    for (let i = 0; i < seg.length; i++) {
      if (i + 2 <= seg.length) tokens.push(seg.slice(i, i + 2));
      if (i + 3 <= seg.length) tokens.push(seg.slice(i, i + 3));
    }
  }
  while ((m = wordRegex.exec(text)) !== null) {
    tokens.push(m[0].toLowerCase());
  }
  return tokens;
}

const STOP_WORDS = new Set([
  "的", "了", "是", "在", "我", "你", "他", "她", "们", "这", "那", "都",
  "也", "就", "还", "又", "才", "会", "能", "可", "要", "想", "说", "看",
  "一个", "一些", "什么", "怎么", "为什么", "因为", "所以", "但是", "而且",
]);

function filterStop(tokens: string[]): string[] {
  return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 0);
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

/** Jaccard 加权相似度（词频加权，不是简单集合交并） */
export function similarity(a: string, b: string): number {
  const ta = filterStop(tokenize(a));
  const tb = filterStop(tokenize(b));
  if (ta.length === 0 || tb.length === 0) return 0;
  const fa = termFreq(ta);
  const fb = termFreq(tb);
  let intersection = 0;
  let union = 0;
  const all = new Set([...fa.keys(), ...fb.keys()]);
  for (const k of all) {
    const x = fa.get(k) || 0;
    const y = fb.get(k) || 0;
    intersection += Math.min(x, y);
    union += Math.max(x, y);
  }
  return union === 0 ? 0 : intersection / union;
}

export interface Candidate {
  id: number;
  text: string;
  studentId?: number;
  subject?: string;
}

/** 从候选中选 topN 最相似的（score > 0 才返回） */
export function selectTopN(
  query: string,
  candidates: Candidate[],
  opts: { topN?: number; preferSameStudent?: number; preferSameSubject?: string } = {}
): { id: number; score: number }[] {
  const { topN = 5, preferSameStudent, preferSameSubject } = opts;
  const scored = candidates.map(c => {
    let score = similarity(query, c.text);
    if (preferSameStudent !== undefined && c.studentId === preferSameStudent) score += 0.3;
    if (preferSameSubject && c.subject === preferSameSubject) score += 0.1;
    return { id: c.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topN);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /workspace && npx vitest run tests/ai/similarity.test.ts`
Expected: PASS（9 测试全过）

- [ ] **Step 5: Commit**

```bash
cd /workspace && git add src/ai/similarity.ts tests/ai/similarity.test.ts && git commit -m "feat(ai): similarity 词频重叠相似度+selectTopN (TDD)"
```

---

### Task 2: types + db v3 迁移 + seed + useSpecProfiles

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/db/schema.ts`
- Modify: `src/db/seed.ts`
- Modify: `src/hooks/useSpecProfiles.ts`

- [ ] **Step 1: 修改 types/index.ts**

在 `src/types/index.ts` 的 `SpecSegment` 接口后、`SpecProfile` 接口前，插入：

```ts
export interface StyleFeatures {
  warmth: number;          // 1-5 温暖度
  formality: number;       // 1-5 正式度
  conciseness: number;     // 1-5 简洁度
  encouragement: number;   // 1-5 鼓励倾向
  addressStyle: string;    // 称呼方式
  punctuation: string;     // 标点偏好
  sentencePattern: string; // 句式偏好
}
```

然后在 `SpecProfile` 接口中加 `styleFeatures` 字段。找到：

```ts
export interface SpecProfile {
  id?: number;
  subject: string;
  name: string;
  tone: Tone;
  styleNote: string;
  segments: SpecSegment[];
  opening: string;
  ending: string;
  lockedFields: string[];
  isBuiltin: boolean;
  createdAt: number;
}
```

改为（在 `ending` 后、`lockedFields` 前插入 `styleFeatures`）：

```ts
export interface SpecProfile {
  id?: number;
  subject: string;
  name: string;
  tone: Tone;
  styleNote: string;
  segments: SpecSegment[];
  opening: string;
  ending: string;
  styleFeatures: StyleFeatures;
  lockedFields: string[];
  isBuiltin: boolean;
  createdAt: number;
}
```

- [ ] **Step 2: 修改 db/schema.ts v2→v3 迁移**

在 `src/db/schema.ts` 的 `constructor` 中，在 `this.version(2)...` 块之后追加 v3：

```ts
    this.version(3).stores({
      students: "++id, name, createdAt",
      specProfiles: "++id, subject, isBuiltin",
      historySamples: "++id, specProfileId",
      feedbacks: "++id, studentId, specProfileId, createdAt",
      tokenUsage: "++id, callType, timestamp",
      settings: "++id",
      suggestions: "++id, specProfileId, status, createdAt",
    }).upgrade((trans) => {
      return trans.table("specProfiles").toCollection().modify((p: any) => {
        if (!p.styleFeatures) {
          p.styleFeatures = {
            warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
            addressStyle: "", punctuation: "", sentencePattern: "",
          };
        }
      });
    });
```

- [ ] **Step 3: 修改 db/seed.ts 内置规范档预填 styleFeatures**

将 `src/db/seed.ts` 整体替换为：

```ts
import { db } from "./schema";
import { SpecProfile } from "../types";

export const BUILTIN_PROFILES: SpecProfile[] = [
  {
    subject: "通用", name: "简短口语风", tone: "口语", styleNote: "亲切简短，三五句话",
    segments: [{ title: "课堂表现", targetWords: 60, contentPoints: "今天学了什么、表现如何", freeNote: "" }],
    opening: "XX妈妈好，今天", ending: "回家建议……",
    styleFeatures: {
      warmth: 5, formality: 1, conciseness: 2, encouragement: 5,
      addressStyle: "XX妈妈", punctuation: "口语化，多用感叹号", sentencePattern: "多用短句",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
  {
    subject: "通用", name: "正式书面风", tone: "正式书面", styleNote: "正式，多用肯定句，结尾带鼓励",
    segments: [
      { title: "课堂内容", targetWords: 80, contentPoints: "本节课知识点", freeNote: "" },
      { title: "学生表现", targetWords: 100, contentPoints: "专注度、掌握情况", freeNote: "" },
      { title: "家庭建议", targetWords: 60, contentPoints: "课后练习建议", freeNote: "" },
    ],
    opening: "该生今日", ending: "望家长配合",
    styleFeatures: {
      warmth: 3, formality: 5, conciseness: 3, encouragement: 4,
      addressStyle: "XX家长您好", punctuation: "规范标点，多用句号", sentencePattern: "长短句结合",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
  {
    subject: "通用", name: "详细分段风", tone: "半书面", styleNote: "详细，按知识点分段",
    segments: [
      { title: "学习内容", targetWords: 120, contentPoints: "知识点逐一列出", freeNote: "" },
      { title: "掌握情况", targetWords: 100, contentPoints: "每个知识点掌握度", freeNote: "" },
      { title: "存在问题", targetWords: 80, contentPoints: "薄弱点", freeNote: "" },
      { title: "后续计划", targetWords: 80, contentPoints: "下节课安排", freeNote: "" },
    ],
    opening: "今日课堂反馈：", ending: "感谢配合",
    styleFeatures: {
      warmth: 4, formality: 3, conciseness: 5, encouragement: 3,
      addressStyle: "XX妈妈您好", punctuation: "规范标点", sentencePattern: "长短句结合",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
];

export async function seedBuiltinProfiles(): Promise<void> {
  const existing = (await db.specProfiles.filter(p => p.isBuiltin).toArray()).length;
  if (existing > 0) return;
  for (const p of BUILTIN_PROFILES) {
    await db.specProfiles.add({ ...p, createdAt: Date.now() });
  }
}
```

- [ ] **Step 4: 修改 useSpecProfiles.ts createProfile + relearn**

在 `src/hooks/useSpecProfiles.ts` 中：

1. import 加 `StyleFeatures`：

找到：
```ts
import { SpecProfile, SpecSegment } from "../types";
```
改为：
```ts
import { SpecProfile, SpecSegment, StyleFeatures } from "../types";
```

2. 在文件顶部（import 之后）加默认值常量：

```ts
const DEFAULT_SF: StyleFeatures = {
  warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
  addressStyle: "", punctuation: "", sentencePattern: "",
};
```

3. 修改 `createProfile` 函数，找到：

```ts
export async function createProfile(subject: string, name: string): Promise<number> {
  return db.specProfiles.add({
    subject, name, tone: "半书面", styleNote: "",
    segments: [{ title: "课堂内容", targetWords: 80, contentPoints: "", freeNote: "" }],
    opening: "", ending: "", lockedFields: [], isBuiltin: false, createdAt: Date.now(),
  });
}
```
改为：
```ts
export async function createProfile(subject: string, name: string): Promise<number> {
  return db.specProfiles.add({
    subject, name, tone: "半书面", styleNote: "",
    segments: [{ title: "课堂内容", targetWords: 80, contentPoints: "", freeNote: "" }],
    opening: "", ending: "", styleFeatures: { ...DEFAULT_SF },
    lockedFields: [], isBuiltin: false, createdAt: Date.now(),
  });
}
```

4. 修改 `relearn` 函数。找到（在 relearn 函数末尾的 `await db.specProfiles.update(id, {` 块）：

```ts
  await db.specProfiles.update(id, {
    tone: locked.has("tone") ? p.tone : learned.tone,
    styleNote: locked.has("styleNote") ? p.styleNote : learned.styleNote,
    opening: locked.has("opening") ? p.opening : learned.opening,
    ending: locked.has("ending") ? p.ending : learned.ending,
    segments,
  });
```
改为（加 styleFeatures，受 `styleFeatures` 锁控制）：

```ts
  await db.specProfiles.update(id, {
    tone: locked.has("tone") ? p.tone : learned.tone,
    styleNote: locked.has("styleNote") ? p.styleNote : learned.styleNote,
    opening: locked.has("opening") ? p.opening : learned.opening,
    ending: locked.has("ending") ? p.ending : learned.ending,
    styleFeatures: locked.has("styleFeatures") ? p.styleFeatures : learned.styleFeatures,
    segments,
  });
```

- [ ] **Step 5: 验证 build**

Run: `cd /workspace && npm run build`
Expected: 成功（注意：现有调用 SpecProfile 的地方可能因新增 styleFeatures 字段报 TS 错误，需逐一修复。重点检查：src/pages/SpecProfilePage.tsx 创建新规范档时是否填了 styleFeatures。如果 SpecProfilePage 里有直接构造 SpecProfile 对象的代码，需补 styleFeatures: { ...DEFAULT_SF } 或从现有 spec 读取。如果 build 失败，优先修复这些构造点。）

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add src/types/index.ts src/db/schema.ts src/db/seed.ts src/hooks/useSpecProfiles.ts && git commit -m "feat(data): StyleFeatures 类型 + db v3 迁移 + 内置档预填 + createProfile 默认值"
```

---

### Task 3: learnPrompt + learn.ts 解析 styleFeatures

**Files:**
- Modify: `src/ai/prompts.ts`
- Modify: `src/ai/learn.ts`
- Test: `tests/ai/learn.test.ts`

- [ ] **Step 1: 修改 learnPrompt**

在 `src/ai/prompts.ts` 中找到 `learnPrompt` 函数，整体替换为：

```ts
export function learnPrompt(samples: string[]) {
  const txt = samples.map((s, i) => `--- 样本${i + 1} ---\n${s}`).join("\n\n");
  const system = `你是反馈格式分析助手。分析以下历史反馈样本，归纳出统一的格式规范和风格特征。
${JSON_INSTRUCTION}
输出 JSON 格式：
{"tone":"正式书面|半书面|口语","styleNote":"风格说明","segments":[{"title":"段落标题","targetWords":数字,"contentPoints":"要点","freeNote":"补充"}],"opening":"常用开头","ending":"常用结尾","styleFeatures":{"warmth":1-5,"formality":1-5,"conciseness":1-5,"encouragement":1-5,"addressStyle":"称呼方式","punctuation":"标点偏好","sentencePattern":"句式偏好"}}

风格特征评分标准：
- warmth（温暖度）：1=冷静客观，3=适中，5=非常温暖亲切
- formality（正式度）：1=口语化，3=适中，5=非常正式书面
- conciseness（简洁度）：1=极简，3=适中，5=非常详细展开
- encouragement（鼓励倾向）：1=少鼓励，3=适中，5=充满鼓励肯定
- addressStyle：如 "XX妈妈您好"
- punctuation：如 "规范标点，多用句号" 或 "口语化，多用感叹号"
- sentencePattern：如 "长短句结合" 或 "多用短句"

styleFeatures 必须填写完整，数值字段必须是 1-5 的整数。`;
  return [{ role: "system", content: system }, { role: "user", content: txt }];
}
```

- [ ] **Step 2: 修改 learn.ts 解析 styleFeatures**

将 `src/ai/learn.ts` 整体替换为：

```ts
// src/ai/learn.ts
import { callDeepSeek } from "./client";
import { learnPrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { Tone, SpecSegment, StyleFeatures } from "../types";

const DEFAULT_SF: StyleFeatures = {
  warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
  addressStyle: "", punctuation: "", sentencePattern: "",
};

function clampInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (isNaN(n)) return fallback;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function parseStyleFeatures(sf: any): StyleFeatures {
  if (!sf || typeof sf !== "object") return { ...DEFAULT_SF };
  return {
    warmth: clampInt(sf.warmth, 3),
    formality: clampInt(sf.formality, 3),
    conciseness: clampInt(sf.conciseness, 3),
    encouragement: clampInt(sf.encouragement, 3),
    addressStyle: typeof sf.addressStyle === "string" ? sf.addressStyle : "",
    punctuation: typeof sf.punctuation === "string" ? sf.punctuation : "",
    sentencePattern: typeof sf.sentencePattern === "string" ? sf.sentencePattern : "",
  };
}

export async function learnSpec(args: { apiKey: string; samples: string[] }): Promise<{
  tone: Tone; styleNote: string; segments: SpecSegment[]; opening: string; ending: string;
  styleFeatures: StyleFeatures;
}> {
  const messages = learnPrompt(args.samples);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "learn");
  const p = parseJsonLoose(res.content);
  return {
    tone: (p.tone as Tone) ?? "半书面",
    styleNote: String(p.styleNote ?? ""),
    segments: Array.isArray(p.segments) ? p.segments.map((s: any) => ({
      title: String(s.title ?? ""), targetWords: Number(s.targetWords ?? 0) || 0,
      contentPoints: String(s.contentPoints ?? ""), freeNote: String(s.freeNote ?? ""),
    })) : [],
    opening: String(p.opening ?? ""), ending: String(p.ending ?? ""),
    styleFeatures: parseStyleFeatures(p.styleFeatures),
  };
}
```

- [ ] **Step 3: 写测试**

创建 `tests/ai/learn.test.ts`：

```ts
import { describe, it, expect } from "vitest";
// 测试 parseStyleFeatures 逻辑（通过 learnSpec 的内部函数）
// 由于 parseStyleFeatures 未导出，我们测 clampInt 行为通过 learnSpec mock
// 这里改用集成测试：mock callDeepSeek 返回不同 JSON，验证解析

import { vi } from "vitest";

// mock callDeepSeek
vi.mock("../../src/ai/client", () => ({
  callDeepSeek: vi.fn(),
}));

import { callDeepSeek } from "../../src/ai/client";
import { learnSpec } from "../../src/ai/learn";

describe("learnSpec styleFeatures 解析", () => {
  it("完整 styleFeatures 正确解析", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "正式书面", styleNote: "正式", segments: [],
        opening: "开头", ending: "结尾",
        styleFeatures: {
          warmth: 4, formality: 5, conciseness: 2, encouragement: 3,
          addressStyle: "XX家长您好", punctuation: "规范标点",
          sentencePattern: "长短句结合",
        },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(4);
    expect(result.styleFeatures.formality).toBe(5);
    expect(result.styleFeatures.addressStyle).toBe("XX家长您好");
  });

  it("styleFeatures 缺失时补默认值", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(3);
    expect(result.styleFeatures.formality).toBe(3);
    expect(result.styleFeatures.addressStyle).toBe("");
  });

  it("数值超范围 clamp 到 1-5", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        styleFeatures: { warmth: 10, formality: 0, conciseness: 3, encouragement: 3 },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(5);
    expect(result.styleFeatures.formality).toBe(1);
  });

  it("非数值字符串解析为数字", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        styleFeatures: { warmth: "4", formality: "3", conciseness: 3, encouragement: 3 },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(4);
    expect(result.styleFeatures.formality).toBe(3);
  });
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /workspace && npx vitest run tests/ai/learn.test.ts`
Expected: PASS（4 测试全过）

- [ ] **Step 5: 验证全量 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，全量测试通过（原 79 + similarity 9 + learn 4 = 92）

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add src/ai/prompts.ts src/ai/learn.ts tests/ai/learn.test.ts && git commit -m "feat(ai): learnPrompt 输出 styleFeatures + learn.ts 防御解析 (TDD)"
```

---

### Task 4: listFeedbacksForFewShot + generate.ts 注入 few-shot

**Files:**
- Modify: `src/hooks/useFeedbacks.ts`
- Modify: `src/ai/prompts.ts`（generatePrompt 加 few-shot + styleFeatures 注入）
- Modify: `src/ai/generate.ts`（调 similarity 检索）

- [ ] **Step 1: 修改 useFeedbacks.ts 加 listFeedbacksForFewShot**

在 `src/hooks/useFeedbacks.ts` 末尾追加：

```ts

/** 取该学生 + 同科目规范档的历史反馈（用于 few-shot 检索池） */
export async function listFeedbacksForFewShot(
  studentId: number,
  specProfileId: number
): Promise<Feedback[]> {
  // 1. 该学生的所有反馈
  const own = await db.feedbacks.where("studentId").equals(studentId).toArray();
  // 2. 同规范档的其他学生反馈（补充池）
  const sameSpec = await db.feedbacks.where("specProfileId").equals(specProfileId).toArray();
  // 合并去重（按 id）
  const map = new Map<number, Feedback>();
  [...own, ...sameSpec].forEach(f => { if (f.id !== undefined) map.set(f.id, f); });
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}
```

- [ ] **Step 2: 修改 generatePrompt 加 few-shot + styleFeatures**

在 `src/ai/prompts.ts` 中找到 `generatePrompt` 函数，整体替换为：

```ts
export function generatePrompt(
  profile: SpecProfile,
  student: Student,
  courseContent: string,
  history: Feedback[],
  includedSegments: SpecSegment[],
) {
  const segDesc = includedSegments.map((s, i) =>
    `第${i + 1}段「${s.title}」约${s.targetWords}字，要点：${s.contentPoints}${s.freeNote ? "；补充：" + s.freeNote : ""}`
  ).join("\n");

  // few-shot：取 history 中 includeInLearning=true 的，最多 5 条
  const fewShot = history.filter(h => h.includeInLearning && h.finalText).slice(-5);
  const fewShotTxt = fewShot.length > 0
    ? fewShot.map((h, i) => `### 示例 ${i + 1}\n课程内容：${h.courseContent || "（未记录）"}\n反馈：${h.finalText}`).join("\n\n")
    : "";

  // 风格特征强约束
  const sf = profile.styleFeatures;
  const warmthDesc = ["", "冷静客观", "平和", "适中", "温暖", "非常温暖亲切"][sf.warmth] || "适中";
  const formalityDesc = ["", "口语化", "半口语", "适中", "正式", "非常正式书面"][sf.formality] || "适中";
  const concisenessDesc = ["", "极简", "简洁", "适中", "详细", "非常详细展开"][sf.conciseness] || "适中";
  const encouragementDesc = ["", "少鼓励", "偶尔鼓励", "适中", "多鼓励", "充满鼓励肯定"][sf.encouragement] || "适中";
  const sfTxt = `## 风格特征（必须严格遵守）
- 温暖度：${sf.warmth}/5（${warmthDesc}）
- 正式度：${sf.formality}/5（${formalityDesc}）
- 简洁度：${sf.conciseness}/5（${concisenessDesc}）
- 鼓励倾向：${sf.encouragement}/5（${encouragementDesc}）
${sf.addressStyle ? `- 称呼方式：${sf.addressStyle}\n` : ""}${sf.punctuation ? `- 标点偏好：${sf.punctuation}\n` : ""}${sf.sentencePattern ? `- 句式偏好：${sf.sentencePattern}` : ""}`;

  const system = `你是教培课后反馈撰写助手。严格按以下规范档撰写反馈。
语气：${profile.tone}；风格说明：${profile.styleNote}
段落结构：
${segDesc}
开头：${profile.opening}
结尾：${profile.ending}

${sfTxt}
${fewShotTxt ? `\n## 参考示例（请模仿其风格、语气、长度、结构）\n${fewShotTxt}` : ""}
${JSON_INSTRUCTION}
输出 JSON 格式：{"feedback":"整篇反馈正文"}`;
  const user = `学生姓名：${student.name}；年级：${student.grade}；性格：${student.personality}；薄弱点：${student.weaknesses}；家长关注：${student.parentFocus}
科目：${profile.subject}
本节课内容（老师口述/输入）：${courseContent}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}
```

注意：few-shot 检索由 `generate.ts` 用 similarity 选 top 5，传给 `generatePrompt` 的 `history` 已经是检索后的 top 5（按 includeInLearning 过滤再 slice(-5) 兜底）。

- [ ] **Step 3: 修改 generate.ts 调 similarity**

将 `src/ai/generate.ts` 整体替换为：

```ts
// src/ai/generate.ts
import { callDeepSeek } from "./client";
import { generatePrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { selectTopN } from "./similarity";
import { SpecProfile, SpecSegment, Student, Feedback } from "../types";

export async function generateFeedback(args: {
  apiKey: string; profile: SpecProfile; student: Student; courseContent: string; history: Feedback[];
  includedSegments: SpecSegment[];
}): Promise<{ feedback: string }> {
  // few-shot 检索：从 history 中选最相似的 top 5（学生偏好 +0.3，同科目偏好 +0.1）
  const candidates = args.history.map(h => ({
    id: h.id!,
    text: h.finalText,
    studentId: h.studentId,
    subject: args.profile.subject,
  }));
  const top = selectTopN(args.courseContent, candidates, {
    topN: 5,
    preferSameStudent: args.student.id,
    preferSameSubject: args.profile.subject,
  });
  const topIds = new Set(top.map(t => t.id));
  const fewShot = args.history.filter(h => h.id !== undefined && topIds.has(h.id));

  const messages = generatePrompt(args.profile, args.student, args.courseContent, fewShot, args.includedSegments);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "generate");
  const parsed = parseJsonLoose(res.content);
  return { feedback: String(parsed.feedback ?? "") };
}
```

- [ ] **Step 4: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，全量测试通过

- [ ] **Step 5: grep 确认无 history.slice(-2) 残留**

Run: `cd /workspace && grep -rn "history.slice(-2)" src/`
Expected: 无输出（已删除）

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add src/hooks/useFeedbacks.ts src/ai/prompts.ts src/ai/generate.ts && git commit -m "feat(ai): few-shot 相似度检索 top5 + styleFeatures 强约束注入"
```

---

### Task 5: SpecProfilePage UI + GeneratePage 接线 + 最终验证

**Files:**
- Modify: `src/pages/SpecProfilePage.tsx`
- Modify: `src/pages/GeneratePage.tsx`

- [ ] **Step 1: 读 SpecProfilePage.tsx 现状**

Read `/workspace/src/pages/SpecProfilePage.tsx`，找到：
- 表单状态管理（useState 的 spec/form 对象）
- 保存函数（调用 updateProfile 的地方）
- 段落编辑区块的渲染位置

确认现有结构后再改。

- [ ] **Step 2: 修改 SpecProfilePage.tsx 加风格特征区块**

在 `src/pages/SpecProfilePage.tsx` 中：

1. import 加 `StyleFeatures` 和 `useState`（如果还没引入）：

找到现有 import 块，确保有：
```ts
import { useState } from "react";
import { StyleFeatures } from "../types";
```

2. 在组件内（和其他表单状态同级）加 styleFeatures 状态：

找到表单状态定义区（如 `const [name, setName] = useState(...)` 等），追加：
```ts
const DEFAULT_SF: StyleFeatures = {
  warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
  addressStyle: "", punctuation: "", sentencePattern: "",
};
const [sf, setSf] = useState<StyleFeatures>(spec?.styleFeatures || DEFAULT_SF);
```

3. 在保存函数中，把 sf 合并到 updateProfile 调用。找到现有的 `await updateProfile(id, { ... })` 调用，在对象里加 `styleFeatures: sf`。例如：

找到：
```ts
await updateProfile(id, {
  name, subject, tone, styleNote, segments, opening, ending,
});
```
改为：
```ts
await updateProfile(id, {
  name, subject, tone, styleNote, segments, opening, ending, styleFeatures: sf,
});
```

4. 在段落编辑区块之前插入风格特征区块 JSX。找到段落编辑的 `<div className="card ...">` 或类似容器，在它之前插入：

```tsx
<div className="card space-y-4">
  <h2 className="section-title">风格特征</h2>
  <p className="hint">learn 时自动归纳，也可手动微调。生成时作为强约束。</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="form-field">
      <label className="label">温暖度：<b className="text-primary">{sf.warmth}/5</b> {["", "冷静客观", "平和", "适中", "温暖", "非常温暖亲切"][sf.warmth]}</label>
      <input type="range" min={1} max={5} step={1} value={sf.warmth} onChange={e => setSf({ ...sf, warmth: Number(e.target.value) })} className="w-full accent-primary" />
    </div>
    <div className="form-field">
      <label className="label">正式度：<b className="text-primary">{sf.formality}/5</b> {["", "口语化", "半口语", "适中", "正式", "非常正式书面"][sf.formality]}</label>
      <input type="range" min={1} max={5} step={1} value={sf.formality} onChange={e => setSf({ ...sf, formality: Number(e.target.value) })} className="w-full accent-primary" />
    </div>
    <div className="form-field">
      <label className="label">简洁度：<b className="text-primary">{sf.conciseness}/5</b> {["", "极简", "简洁", "适中", "详细", "非常详细展开"][sf.conciseness]}</label>
      <input type="range" min={1} max={5} step={1} value={sf.conciseness} onChange={e => setSf({ ...sf, conciseness: Number(e.target.value) })} className="w-full accent-primary" />
    </div>
    <div className="form-field">
      <label className="label">鼓励倾向：<b className="text-primary">{sf.encouragement}/5</b> {["", "少鼓励", "偶尔鼓励", "适中", "多鼓励", "充满鼓励肯定"][sf.encouragement]}</label>
      <input type="range" min={1} max={5} step={1} value={sf.encouragement} onChange={e => setSf({ ...sf, encouragement: Number(e.target.value) })} className="w-full accent-primary" />
    </div>
  </div>
  <div className="form-field">
    <label className="label">称呼方式</label>
    <input className="input" placeholder="如：XX妈妈您好 / 亲爱的XX家长" value={sf.addressStyle} onChange={e => setSf({ ...sf, addressStyle: e.target.value })} />
  </div>
  <div className="form-field">
    <label className="label">标点偏好</label>
    <input className="input" placeholder="如：规范标点，多用句号 / 口语化，多用感叹号" value={sf.punctuation} onChange={e => setSf({ ...sf, punctuation: e.target.value })} />
  </div>
  <div className="form-field">
    <label className="label">句式偏好</label>
    <input className="input" placeholder="如：长短句结合 / 多用短句 / 多用排比" value={sf.sentencePattern} onChange={e => setSf({ ...sf, sentencePattern: e.target.value })} />
  </div>
</div>
```

- [ ] **Step 3: 读 GeneratePage.tsx 现状**

Read `/workspace/src/pages/GeneratePage.tsx`，找到调用 `listFeedbacksByStudent` 的地方，确认如何替换为 `listFeedbacksForFewShot`。

- [ ] **Step 4: 修改 GeneratePage.tsx 接线**

在 `src/pages/GeneratePage.tsx` 中：

1. import 替换。找到：
```ts
import { listFeedbacksByStudent } from "../hooks/useFeedbacks";
```
改为：
```ts
import { listFeedbacksByStudent, listFeedbacksForFewShot } from "../hooks/useFeedbacks";
```

2. 找到生成反馈时调用 `listFeedbacksByStudent` 的地方（通常在 generateOne 或 handleGenerate 函数内），把它改为 `listFeedbacksForFewShot`。

具体：找到类似 `const history = await listFeedbacksByStudent(studentId);` 的代码，改为：
```ts
const history = await listFeedbacksForFewShot(studentId, specProfileId);
```

注意：`listFeedbacksForFewShot` 签名是 `(studentId, specProfileId)`，比 `listFeedbacksByStudent(studentId)` 多一个参数。确认调用处能拿到 specProfileId（通常从选中的 spec 来）。如果调用处变量名不同，按实际改。

如果 GeneratePage 里还有其他地方用 `listFeedbacksByStudent`（如显示历史反馈列表），**不要改那些**，只改用于 generate 的那一处。

- [ ] **Step 5: 验证全量 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，全量测试通过（92 测试）

- [ ] **Step 6: grep 残留检查**

Run: `cd /workspace && grep -rn "history.slice(-2)" src/`
Expected: 无输出

- [ ] **Step 7: Commit**

```bash
cd /workspace && git add src/pages/SpecProfilePage.tsx src/pages/GeneratePage.tsx && git commit -m "feat(ui): 风格特征编辑区块 + GeneratePage 接线 few-shot 检索"
```

---

## Self-Review

### 1. Spec 覆盖检查

- §2 相似度算法 → Task 1 ✓
- §3 few-shot 检索流程 → Task 4 ✓
- §3 few-shot 注入 prompt → Task 4 ✓
- §4 learn 归纳 styleFeatures → Task 3 ✓
- §5 SpecProfilePage 编辑 UI → Task 5 ✓
- §6 内置规范档预填 → Task 2 ✓
- §1 数据变更（types + db v3）→ Task 2 ✓
- §1 useSpecProfiles createProfile 默认值 → Task 2 ✓
- §1 useSpecProfiles relearn 合并 → Task 2 ✓

全部覆盖，无遗漏。

### 2. Placeholder 扫描

- 无 TBD/TODO ✓
- 所有代码完整 ✓
- 无"类似 Task N"引用 ✓

### 3. 类型一致性

- `StyleFeatures` 接口：Task 2 定义，Task 3 引用，Task 5 引用 ✓
- `selectTopN` 签名：Task 1 定义 `(query, candidates, opts)`，Task 4 调用一致 ✓
- `listFeedbacksForFewShot` 签名：Task 4 定义 `(studentId, specProfileId)`，Task 5 调用一致 ✓
- `learnSpec` 返回：Task 3 加 `styleFeatures`，Task 2 relearn 消费 `learned.styleFeatures` ✓
- `generatePrompt` 签名：保持原状 `(profile, student, courseContent, history, includedSegments)`，Task 4 内部逻辑改但签名不变 ✓
- `SpecProfile.styleFeatures`：Task 2 加字段，Task 3/4/5 都正确引用 ✓

一致性通过。
