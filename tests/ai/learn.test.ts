import { describe, it, expect, vi } from "vitest";
import { learnSpec } from "../../src/ai/learn";

describe("learnSpec", () => {
  it("parses learned profile structure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"tone":"正式书面","styleNote":"简洁","segments":[{"title":"课堂","targetWords":80,"contentPoints":"知识点","freeNote":""}],"opening":"该生今日","ending":"建议"}' } }], usage: { prompt_tokens: 100, completion_tokens: 50 } }),
    } as any));
    const out = await learnSpec({ apiKey: "k", samples: ["样本1"] });
    expect(out.tone).toBe("正式书面");
    expect(out.segments).toHaveLength(1);
    expect(out.segments[0].targetWords).toBe(80);
  });

  it("handles empty segments gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"tone":"口语","styleNote":"","segments":[],"opening":"","ending":""}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
    } as any));
    const out = await learnSpec({ apiKey: "k", samples: ["x"] });
    expect(out.segments).toHaveLength(0);
    expect(out.tone).toBe("口语");
  });
});
