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
