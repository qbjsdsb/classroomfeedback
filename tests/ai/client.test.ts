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

  it("retries on 5xx failure then succeeds", async () => {
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

  it("throws after max retries on persistent 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as any));
    await expect(callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "learn")).rejects.toThrow();
  });

  it("does NOT retry on 401 (invalid API Key) - fails fast with friendly message", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      return { ok: false, status: 401, json: async () => ({ error: { message: "invalid api key" } }) } as any;
    }));
    await expect(callDeepSeek({ apiKey: "bad", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct"))
      .rejects.toThrow(/API Key|401/);
    expect(calls).toBe(1);
  });

  it("does NOT retry on 403 - fails fast", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      return { ok: false, status: 403, json: async () => ({}) } as any;
    }));
    await expect(callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct"))
      .rejects.toThrow();
    expect(calls).toBe(1);
  });

  it("does NOT retry on 400 (bad request) - fails fast", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      return { ok: false, status: 400, json: async () => ({ error: { message: "bad request" } }) } as any;
    }));
    await expect(callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct"))
      .rejects.toThrow();
    expect(calls).toBe(1);
  });

  it("does NOT retry on 429 (rate limit) - fails fast to avoid burning quota", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      return { ok: false, status: 429, json: async () => ({}) } as any;
    }));
    await expect(callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct"))
      .rejects.toThrow(/频繁|429/);
    expect(calls).toBe(1);
  });

  it("retries on network error (fetch rejects) then succeeds", async () => {
    const fake = { choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) throw new Error("network down");
      return { ok: true, json: async () => fake } as any;
    }));
    const res = await callDeepSeek({ apiKey: "k", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "generate");
    expect(res.content).toBe("ok");
    expect(calls).toBe(2);
  });

  it("includes DeepSeek error message in thrown error when available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: { message: "Authentication Fails: Your API key is invalid" } })
    } as any));
    await expect(callDeepSeek({ apiKey: "bad", model: "deepseek-chat", messages: [{ role: "user", content: "x" }] }, "correct"))
      .rejects.toThrow(/invalid|API Key/i);
  });
});
