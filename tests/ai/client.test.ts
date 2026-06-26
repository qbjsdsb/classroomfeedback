import { describe, it, expect, vi, beforeEach } from "vitest";
import { callDeepSeek } from "../../src/ai/client";
import { db } from "../../src/db/schema";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("callDeepSeek", () => {
  it("returns content and records token usage", async () => {
    const fake = { choices: [{ message: { content: "hi" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => fake } as any));
    const res = await callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct");
    expect(res.content).toBe("hi");
    const usage = await db.tokenUsage.toArray();
    expect(usage).toHaveLength(1);
    expect(usage[0].promptTokens).toBe(10);
  });

  it("retries on failure then succeeds", async () => {
    const fake = { choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) return { ok: false, status: 500, json: async () => ({}) } as any;
      return { ok: true, json: async () => fake } as any;
    }));
    const res = await callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "generate");
    expect(res.content).toBe("ok");
    expect(calls).toBe(2);
  });

  it("throws after max retries", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as any));
    await expect(callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "learn")).rejects.toThrow();
  });
});
