import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../../src/db/schema";
import { getStats } from "../../src/hooks/useStats";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("getStats", () => {
  it("byDay 用中国时区日期（凌晨数据归当天）", async () => {
    // UTC 2026-06-26 16:00 = 北京 2026-06-27 00:00，旧 toISOString 会归 06-26
    await db.tokenUsage.add({ callType: "generate", promptTokens: 10, completionTokens: 5, timestamp: Date.UTC(2026, 5, 26, 16, 0, 0) });
    const s = await getStats();
    expect(s.byDay["2026-06-27"]).toBe(15);
    expect(s.byDay["2026-06-26"]).toBeUndefined();
  });

  it("recent7 长度为 7 且升序", async () => {
    await db.tokenUsage.add({ callType: "generate", promptTokens: 1, completionTokens: 1, timestamp: Date.now() });
    const s = await getStats();
    expect(s.recent7).toHaveLength(7);
    for (let i = 1; i < 7; i++) {
      expect(s.recent7[i].day > s.recent7[i - 1].day).toBe(true);
    }
  });

  it("recent7 自动补零（无数据天 tokens=0）", async () => {
    const s = await getStats();
    expect(s.recent7.every(d => typeof d.tokens === "number")).toBe(true);
    // 全空库，所有天应为 0
    expect(s.recent7.every(d => d.tokens === 0)).toBe(true);
  });

  it("recent7 最后一天是今天", async () => {
    const s = await getStats();
    const { localDay } = await import("../../src/lib/time");
    expect(s.recent7[6].day).toBe(localDay(Date.now()));
  });

  it("total 和 byType 累加正确", async () => {
    await db.tokenUsage.add({ callType: "correct", promptTokens: 10, completionTokens: 5, timestamp: Date.now() });
    await db.tokenUsage.add({ callType: "generate", promptTokens: 20, completionTokens: 10, timestamp: Date.now() });
    const s = await getStats();
    expect(s.total).toBe(45);
    expect(s.byType.correct).toBe(15);
    expect(s.byType.generate).toBe(30);
  });
});
