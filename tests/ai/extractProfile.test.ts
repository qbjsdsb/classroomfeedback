import { describe, it, expect, vi } from "vitest";
import { extractProfile } from "../../src/ai/extractProfile";

describe("extractProfile", () => {
  it("parses profile proposals", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"personalityProposal":"专注度波动","weaknessesProposal":"幂函数粗心","parentFocusProposal":""}' } }], usage: { prompt_tokens: 50, completion_tokens: 30 } }),
    } as any));
    const out = await extractProfile({ apiKey: "k", studentName: "张三", feedbackTexts: ["反馈1", "反馈2"] });
    expect(out.weaknessesProposal).toBe("幂函数粗心");
    expect(out.parentFocusProposal).toBe("");
    expect(out.sourceFeedbackCount).toBe(2);
  });
});
