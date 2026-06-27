import { db } from "../db/schema";
import { CallType } from "../types";
import { localDay } from "../lib/time";

export interface Stats {
  total: number;
  byType: Record<CallType, number>;
  byDay: Record<string, number>;
  recent7: { day: string; tokens: number }[];
}

export async function getStats(): Promise<Stats> {
  const all = await db.tokenUsage.toArray();
  const byType: Record<CallType, number> = {
    correct: 0, generate: 0, learn: 0,
    split: 0, analyzeEdits: 0, extractProfile: 0,
  };
  const byDay: Record<string, number> = {};
  let total = 0;
  for (const u of all) {
    const t = u.promptTokens + u.completionTokens;
    total += t;
    byType[u.callType] += t;
    const day = localDay(u.timestamp);
    byDay[day] = (byDay[day] ?? 0) + t;
  }
  // 近 7 天，升序，无数据天补零
  // 中国无夏令时，now - i*86400000 跨天安全；再用 localDay 归属确保日期正确
  const recent7: { day: string; tokens: number }[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const ts = now - i * 24 * 3600 * 1000;
    const day = localDay(ts);
    recent7.push({ day, tokens: byDay[day] ?? 0 });
  }
  return { total, byType, byDay, recent7 };
}
