# 模仿优先生成重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把生成流程从"结构化拆解+AI 重组"重构为"模仿优先"——AI 逐字学历史反馈的语气/句式/节奏/用词，只换课程内容，实现"像同一个人写的"。

**Architecture:** fewShot/金标准样本升级为主约束（语气/格式/句式/用词全模仿），segments 降级为内容覆盖清单（只确保提到这些点），styleFeatures 在 generate 时不注入（消除与模仿的冲突）。新增 exemplarSamples 金标准字段作为新学生无历史时的模仿兜底。

**Tech Stack:** TypeScript + React + Dexie.js + DeepSeek API，无新增依赖

---

## 背景与反思

### 用户反馈
"更糟糕了，我希望的是严格按所上传的课堂反馈，严格按格式语气以及等等等等，就好像同一个人写出来的一样"

### 根因分析（当前流程为什么更糟糕）
1. **拆解再重组有信息损失**：learn 把老师反馈拆成 segments/styleFeatures/opening/ending，生成时 AI 按这些字段重组，无法还原原始语气节奏
2. **AI 自由发挥填充**：contentPoints 只是"要点"（如"本节课知识点"），具体内容全靠 AI 现编，用词句式和老师手写完全不同
3. **多重约束互相打架**：segments 要点 + styleFeatures 评分 + format 规则 + 内容边界 + fewShot，5 套约束让 AI 无所适从，输出变成四不像

### 核心转变
- **旧**：规范档 segments 是主约束，fewShot 是参考
- **新**：fewShot/金标准是主约束（语气/句式/用词/节奏全模仿），segments 是辅助（内容覆盖清单 + 客观 format）

### 4 个已确认决策
1. 模仿粒度：学风格但不僵化套用（AI 学句式/连接词/节奏，内容自由组织）
2. 金标准样本：加 exemplarSamples 字段（learn 时 AI 选 1-2 条代表性样本，生成时作为金标准注入）
3. styleFeatures：generate 时不注入（只在 learn 时归纳存档，供老师查看）
4. few-shot 来源：同一学生优先（老师对同一学生写法最一致），其次同规范档，词频相似度作 tiebreaker

---

## File Structure

| 文件 | 责任 | 改动 |
|---|---|---|
| `src/types/index.ts` | SpecProfile 加 exemplarSamples 字段 | 修改 |
| `src/db/schema.ts` | v4→v5 迁移补 exemplarSamples 默认值 | 修改 |
| `src/db/seed.ts` | 内置档 exemplarSamples 留空（内置档无样本） | 修改 |
| `src/hooks/useSpecProfiles.ts` | createProfile/relearn 处理 exemplarSamples | 修改 |
| `src/ai/learn.ts` | learnPrompt 输出 exemplarSamples；learnSpec 解析 | 修改 |
| `src/ai/prompts.ts` | learnPrompt 加 exemplarSamples 指令；generatePrompt 重构为模仿优先 | 修改 |
| `src/ai/generate.ts` | few-shot 检索改为同一学生优先 + top 3；注入 exemplarSamples | 修改 |
| `src/ai/similarity.ts` | selectTopN 加 sameStudentFirst 选项 | 修改 |
| `src/pages/SpecProfilePage.tsx` | 展示 exemplarSamples（只读） | 修改 |
| `tests/ai/similarity.test.ts` | sameStudentFirst 测试 | 修改 |
| `tests/ai/learn.test.ts` | exemplarSamples 解析测试 | 修改 |
| `tests/ai/generate.test.ts` | 新 prompt 结构测试 | 修改 |

---

### Task 1: 数据层——exemplarSamples 字段 + db v5 迁移

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/db/schema.ts`
- Modify: `src/db/seed.ts`
- Modify: `src/hooks/useSpecProfiles.ts`
- Modify: 所有构造 SpecProfile 的测试文件（补 exemplarSamples 默认值）

- [ ] **Step 1: 修改 types/index.ts 加 exemplarSamples 字段**

在 SpecProfile 接口的 styleFeatures 后、lockedFields 前插入：

```ts
exemplarSamples: string[];  // learn 时选的 1-2 条代表性样本，生成时作为金标准
```

修改后 SpecProfile：
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
  exemplarSamples: string[];
  lockedFields: string[];
  isBuiltin: boolean;
  createdAt: number;
}
```

- [ ] **Step 2: 修改 db/schema.ts 加 v5 迁移**

在 v4 块之后追加 v5：

```ts
    this.version(5).stores({
      students: "++id, name, createdAt",
      specProfiles: "++id, subject, isBuiltin",
      historySamples: "++id, specProfileId",
      feedbacks: "++id, studentId, specProfileId, createdAt",
      tokenUsage: "++id, callType, timestamp",
      settings: "++id",
      suggestions: "++id, specProfileId, status, createdAt",
    }).upgrade((trans) => {
      return trans.table("specProfiles").toCollection().modify((p: any) => {
        if (!Array.isArray(p.exemplarSamples)) {
          p.exemplarSamples = [];
        }
      });
    });
```

- [ ] **Step 3: 修改 db/seed.ts 内置档补 exemplarSamples**

3 个内置档都加 `exemplarSamples: []`（内置档无真实样本）。

- [ ] **Step 4: 修改 useSpecProfiles.ts**

1. createProfile 加 `exemplarSamples: []`
2. relearn 的 db.specProfiles.update 加 `exemplarSamples: locked.has("exemplarSamples") ? p.exemplarSamples : learned.exemplarSamples`

注意：learned.exemplarSamples 在 Task 2 才有，本 Task 用 `(learned as any).exemplarSamples ?? p.exemplarSamples ?? []` 兜底（同 Task 1 format 字段的 as any 模式，Task 2 去掉）。

- [ ] **Step 5: 修复所有 SpecProfile 构造点**

用 Grep 搜索所有构造 SpecProfile 对象的地方（tests/ 和 src/），补 `exemplarSamples: []`。

- [ ] **Step 6: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，94 测试全过

- [ ] **Step 7: Commit**

```bash
cd /workspace && git add -A && git -c user.name=trae -c user.email=trae@local commit -m "feat(data): SpecProfile 加 exemplarSamples 字段 + db v5 迁移"
```

---

### Task 2: learn 层——learnPrompt 输出 exemplarSamples + learnSpec 解析

**Files:**
- Modify: `src/ai/prompts.ts`（learnPrompt 加 exemplarSamples 指令）
- Modify: `src/ai/learn.ts`（解析 exemplarSamples + 防御）
- Modify: `src/hooks/useSpecProfiles.ts`（relearn 去 as any）
- Modify: `tests/ai/learn.test.ts`（加 exemplarSamples 测试）

- [ ] **Step 1: 修改 learnPrompt 加 exemplarSamples 输出指令**

在 learnPrompt 的 JSON 格式说明中，segments 后、styleFeatures 前加 exemplarSamples 字段：

```
"exemplarSamples":["代表性样本1原文","代表性样本2原文"]
```

并在系统提示中加说明：

```
exemplarSamples：从上传的样本中选 1-2 条最能体现该老师反馈风格的真实原文（逐字摘录，不修改），作为生成时的金标准。选最完整、最典型的，不要选异常短的。
```

- [ ] **Step 2: 修改 learn.ts 解析 exemplarSamples**

learnSpec 返回类型加 `exemplarSamples: string[]`。解析逻辑：

```ts
exemplarSamples: Array.isArray(p.exemplarSamples)
  ? p.exemplarSamples.filter((s: any) => typeof s === "string" && s.trim()).slice(0, 2).map((s: string) => s)
  : [],
```

防御：非数组返回 []，过滤非字符串和空串，最多取 2 条。

- [ ] **Step 3: 修改 useSpecProfiles.ts relearn 去 as any**

```ts
exemplarSamples: locked.has("exemplarSamples") ? p.exemplarSamples : learned.exemplarSamples,
```

- [ ] **Step 4: 加测试**

learn.test.ts 加 2 个测试：
- exemplarSamples 正确解析（2 条字符串）
- exemplarSamples 缺失/非数组时返回 []

- [ ] **Step 5: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，96 测试全过（94 + 2 新）

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add -A && git -c user.name=trae -c user.email=trae@local commit -m "feat(ai): learnPrompt 输出 exemplarSamples + learn.ts 防御解析 (TDD)"
```

---

### Task 3: similarity 层——selectTopN 加 sameStudentFirst 选项

**Files:**
- Modify: `src/ai/similarity.ts`
- Modify: `tests/ai/similarity.test.ts`

- [ ] **Step 1: 修改 selectTopN 加 sameStudentFirst 选项**

当前 preferSameStudent 是 +0.3 加权。新增 sameStudentFirst 选项：当为 true 时，同一学生的候选**强制排在最前**（无论词频相似度多低），再按 score 降序排其他。

```ts
export function selectTopN(
  query: string,
  candidates: Candidate[],
  opts: { topN?: number; preferSameStudent?: number; preferSameSubject?: string; sameStudentFirst?: boolean } = {}
): { id: number; score: number }[] {
  const { topN = 5, preferSameStudent, preferSameSubject, sameStudentFirst } = opts;
  const scored = candidates.map(c => {
    let score = similarity(query, c.text);
    if (preferSameStudent !== undefined && c.studentId === preferSameStudent) score += 0.3;
    if (preferSameSubject && c.subject === preferSameSubject) score += 0.1;
    return { id: c.id, score, _sameStudent: sameStudentFirst && c.studentId === preferSameStudent };
  });
  // sameStudentFirst 时，同一学生的强制排前，内部按 score 降序；其余按 score 降序
  scored.sort((a, b) => {
    if (sameStudentFirst) {
      if (a._sameStudent && !b._sameStudent) return -1;
      if (!a._sameStudent && b._sameStudent) return 1;
    }
    return b.score - a.score;
  });
  return scored.filter(s => s.score > 0 || s._sameStudent).slice(0, topN).map(({ id, score }) => ({ id, score }));
}
```

注意：filter 时 `s.score > 0 || s._sameStudent`——同一学生的即使 score=0 也保留（老师对同一学生的反馈即使内容不同词频，写法也是一致的，值得模仿）。

- [ ] **Step 2: 加测试**

similarity.test.ts 加 2 个测试：
- sameStudentFirst 时同一学生的排前（即使词频相似度为 0）
- sameStudentFirst 时同一学生内部按 score 降序

- [ ] **Step 3: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，98 测试全过（96 + 2 新）

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add -A && git -c user.name=trae -c user.email=trae@local commit -m "feat(ai): selectTopN 加 sameStudentFirst 选项（同一学生强制排前）(TDD)"
```

---

### Task 4: generate 层——重构 generatePrompt 为模仿优先

**Files:**
- Modify: `src/ai/prompts.ts`（generatePrompt 重构）
- Modify: `src/ai/generate.ts`（few-shot 检索改 sameStudentFirst + top 3 + 注入 exemplarSamples）
- Modify: `tests/ai/generate.test.ts`（如需更新断言）
- Modify: `tests/ai/prompts.test.ts`（如需更新断言）

- [ ] **Step 1: 重构 generatePrompt 为模仿优先**

整体替换 generatePrompt。核心变化：
1. **fewShot 升级为主约束**：放最前面，明确"逐字模仿其句式/连接词/段落长度/标点/语气节奏，只把课程内容换成今天的"
2. **exemplarSamples 作为金标准**：如果有，放在 fewShot 之前，标记为"该老师最典型的反馈风格，必须最严格模仿"
3. **segments 降级为内容覆盖清单**：从"段落结构与要点（只能写这些内容）"改为"内容覆盖清单（确保提到这些点，怎么写看示例）"
4. **styleFeatures 不注入**：删除 sfTxt 整段
5. **opening/ending 弱化**：从"开头xxx融入第1段"改为"参考示例的开头结尾方式"
6. **format 规则保留**：客观格式，与模仿不冲突
7. **内容边界保留**：不加模板外内容

新 generatePrompt：

```ts
export function generatePrompt(
  profile: SpecProfile,
  student: Student,
  courseContent: string,
  history: Feedback[],
  includedSegments: SpecSegment[],
) {
  // 内容覆盖清单：segments 降级为"确保提到这些点"
  const contentChecklist = includedSegments.map((s, i) =>
    `第${i + 1}段「${s.title}」：确保提到以下要点——${s.contentPoints}${s.freeNote ? "（补充：" + s.freeNote + "）" : ""}`
  ).join("\n");

  // 输出格式规则：基于每段 format（保留，客观格式）
  const formatRules = includedSegments.map((s, i) => {
    if (s.format === "title") {
      return `第${i + 1}段以"【${s.title}】"开头，后接正文`;
    } else if (s.format === "number") {
      return `第${i + 1}段以"${i + 1}. "开头，后接正文`;
    } else {
      return `第${i + 1}段直接写正文，无标题无序号`;
    }
  }).join("\n");

  // 金标准样本（learn 时选的代表性原文）
  const exemplarTxt = profile.exemplarSamples && profile.exemplarSamples.length > 0
    ? profile.exemplarSamples.map((s, i) => `### 金标准 ${i + 1}（该老师最典型的反馈，必须最严格模仿其语气/句式/节奏/用词）\n${s}`).join("\n\n")
    : "";

  // few-shot：历史反馈作为模仿模板（最多 3 条）
  const fewShot = history.filter(h => h.includeInLearning && h.finalText).slice(-3);
  const fewShotTxt = fewShot.length > 0
    ? fewShot.map((h, i) => `### 模仿范本 ${i + 1}（逐字模仿其句式/连接词/段落长度/标点/语气节奏，只换课程内容）\n课程内容：${h.courseContent || "（未记录）"}\n反馈：${h.finalText}`).join("\n\n")
    : "";

  const system = `你是教培课后反馈撰写助手。你的任务是：用与老师历史反馈**完全相同的语气、句式、连接词、段落长度、标点习惯、节奏**撰写今天的反馈，只把课程内容换成今天的。像是同一个人写的。

${exemplarTxt ? `## 金标准（最严格模仿）\n${exemplarTxt}\n\n` : ""}${fewShotTxt ? `## 模仿范本（逐字模仿其风格）\n${fewShotTxt}\n\n` : ""}## 内容覆盖清单（确保提到这些点，怎么写看上面范本）
${contentChecklist}

## 输出格式规则（客观格式，必须遵守）
${formatRules}
- 段落之间用一个空行分隔
- 整篇反馈只含上述${includedSegments.length}个段落，不得增减段落
${profile.opening ? `- 开头参考范本的方式融入第1段（如范本用"${profile.opening}"开头，今天也用类似方式）` : ""}${profile.ending ? `- 结尾参考范本的方式融入最后一段` : ""}

## 内容边界（必须严格遵守）
- 只能输出上述段落，不得新增 segments 之外的段落、句子、寒暄、客套话、署名
- 不得添加"希望家长配合""如有疑问联系老师"等范本未出现的客套话
- 每段内容紧扣该段要点，不跨段混写
- 语气/用词/句式严格模仿上面的金标准和范本，不要用 AI 自己的腔调

${JSON_INSTRUCTION}
输出 JSON 格式：{"feedback":"整篇反馈正文"}`;
  const user = `学生姓名：${student.name}；年级：${student.grade}；性格：${student.personality}；薄弱点：${student.weaknesses}；家长关注：${student.parentFocus}
科目：${profile.subject}
本节课内容（老师口述/输入）：${courseContent}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}
```

- [ ] **Step 2: 修改 generate.ts few-shot 检索 + 注入 exemplarSamples**

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
  // few-shot 检索：同一学生优先（强制排前），top 3
  const candidates = args.history.map(h => ({
    id: h.id!,
    text: h.finalText,
    studentId: h.studentId,
    subject: args.profile.subject,
  }));
  const top = selectTopN(args.courseContent, candidates, {
    topN: 3,
    preferSameStudent: args.student.id,
    preferSameSubject: args.profile.subject,
    sameStudentFirst: true,
  });
  const topIds = new Set(top.map(t => t.id));
  const fewShot = args.history.filter(h => h.id !== undefined && topIds.has(h.id));

  const messages = generatePrompt(args.profile, args.student, args.courseContent, fewShot, args.includedSegments);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "generate");
  const parsed = parseJsonLoose(res.content);
  return { feedback: String(parsed.feedback ?? "") };
}
```

变化：topN 5→3，加 sameStudentFirst: true。

- [ ] **Step 3: 检查并更新 tests/ai/prompts.test.ts 和 generate.test.ts**

Read 两个测试文件，看断言是否与新 prompt 冲突。可能需更新：
- 断言"风格特征"→ 新 prompt 无此字符串，删除或改断言
- 断言"段落结构与要点"→ 新 prompt 改为"内容覆盖清单"，更新断言
- 断言"参考示例"→ 新 prompt 改为"模仿范本"，更新断言

**严谨**：不弱化断言，只更新字符串指向新 prompt 的对应位置。

- [ ] **Step 4: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，98 测试全过

- [ ] **Step 5: grep 残留检查**

Run: `cd /workspace && grep -rn "段落结构与要点\|风格特征（必须严格遵守）\|参考示例" src/`
Expected: 无输出（generatePrompt 已重构，learnPrompt 的 styleFeatures 保留但 generatePrompt 不再用这些词）

注意：learnPrompt 仍含"风格特征评分标准"（用于 learn 归纳），这个保留。grep 只查 generatePrompt 相关的残留。

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add -A && git -c user.name=trae -c user.email=trae@local commit -m "feat(ai): generatePrompt 重构为模仿优先（fewShot/金标准为主约束，segments 降级为内容清单，去 styleFeatures）"
```

---

### Task 5: UI 层——SpecProfilePage 展示 exemplarSamples + 最终验证

**Files:**
- Modify: `src/pages/SpecProfilePage.tsx`

- [ ] **Step 1: 读 SpecProfilePage.tsx 现状**

理解现有结构，找到合适位置展示 exemplarSamples（建议放在风格特征区块之后、段落编辑之前，作为"该规范档学到的典型反馈"展示）。

- [ ] **Step 2: 加 exemplarSamples 展示区块（只读）**

```tsx
{cur?.exemplarSamples && cur.exemplarSamples.length > 0 && (
  <div className="card space-y-2">
    <h2 className="section-title">金标准样本（learn 时自动选取，生成时最严格模仿）</h2>
    <p className="hint">以下是该规范档学到的最典型反馈原文。生成新反馈时会以这些为金标准模仿。</p>
    {cur.exemplarSamples.map((s, i) => (
      <div key={i} className="card-accent">
        <div className="text-xs text-muted mb-1">金标准 {i + 1}</div>
        <div className="whitespace-pre-wrap text-sm">{s}</div>
      </div>
    ))}
  </div>
)}
```

注意：className 跟随现有风格（card/section-title/hint/card-accent/text-muted/text-xs/text-sm/whitespace-pre-wrap）。先 Grep 确认这些 class 存在。

- [ ] **Step 3: 验证 build + test**

Run: `cd /workspace && npm run build && npm test`
Expected: build 成功，98 测试全过

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add -A && git -c user.name=trae -c user.email=trae@local commit -m "feat(ui): SpecProfilePage 展示金标准样本（只读）"
```

---

## Self-Review

### 1. Spec 覆盖检查
- 模仿优先（fewShot 主约束）→ Task 4 ✓
- 金标准样本（exemplarSamples）→ Task 1/2/4/5 ✓
- styleFeatures 不注入 generate → Task 4 ✓
- 同一学生优先检索 → Task 3/4 ✓
- segments 降级为内容清单 → Task 4 ✓
- format 保留 → Task 4 ✓
- 内容边界保留 → Task 4 ✓

### 2. Placeholder 扫描
- 无 TBD/TODO ✓
- 所有代码完整 ✓

### 3. 类型一致性
- `exemplarSamples: string[]`：Task 1 定义，Task 2/4/5 引用 ✓
- `sameStudentFirst` 选项：Task 3 定义，Task 4 调用 ✓
- `learnSpec` 返回加 exemplarSamples：Task 2，Task 1 relearn 用 as any 兜底，Task 2 去掉 ✓
- `selectTopN` 签名：Task 3 加 sameStudentFirst 可选参数，向后兼容 ✓

一致性通过。

---

## 风险与验证策略

1. **模仿效果需真实生成验证**：prompt 改完只能靠 build/test 保证不崩，实际"像不像"需用户真实生成几条反馈确认。本 plan 是第一轮重构，若仍有偏差，根据用户具体反馈做第二轮调优。

2. **exemplarSamples 质量依赖 learn**：AI 选的样本可能不是最典型的。UI 展示让老师确认，若不满意可手动 relearn（重新上传样本）。

3. **新学生无历史时**：fewShot 检索可能为空，此时靠 exemplarSamples（learn 时定的金标准）兜底。若 exemplarSamples 也为空（未 learn 过），退化为只靠 segments 内容清单 + format 规则，模仿效果差——但这是不可避免的，需用户先 learn。

4. **styleFeatures 在 generate 移除后**：learn 仍归纳存档，UI 仍可查看编辑，但生成时不影响输出。消除与模仿的冲突是核心收益。
