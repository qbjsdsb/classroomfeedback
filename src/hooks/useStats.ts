import { db } from "../db/schema";
import { CallType } from "../types";

export interface Stats {
  total: number;
  byType: Record<CallType, number>;
  byDay: Record<string, number>;
}

export async function getStats(): Promise<Stats> {
  const all = await db.tokenUsage.toArray();
  const byType: Record<CallType, number> = { correct: 0, generate: 0, learn: 0 };
  const byDay: Record<string, number> = {};
  let total = 0;
  for (const u of all) {
    const t = u.promptTokens + u.completionTokens;
    total += t;
    byType[u.callType] += t;
    const day = new Date(u.timestamp).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + t;
  }
  return { total, byType, byDay };
}
