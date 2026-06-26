import { describe, it, expect, vi } from "vitest";
import { correctText } from "../../src/ai/correct";

describe("correctText", () => {
  it("returns corrected text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "张三今天学了幂函数" } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }),
    } as any));
    const out = await correctText({ apiKey: "k", rawText: "张三今天学了幂含数", studentNames: ["张三"], subjectTerms: ["幂函数"] });
    expect(out).toBe("张三今天学了幂函数");
  });
});
