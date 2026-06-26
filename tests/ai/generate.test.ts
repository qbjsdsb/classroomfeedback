import { describe, it, expect, vi } from "vitest";
import { generateFeedback } from "../../src/ai/generate";
import { SpecProfile, Student, Feedback } from "../../src/types";

const profile: SpecProfile = { subject: "数学", name: "p", tone: "正式书面", styleNote: "", segments: [{ title: "课堂", targetWords: 80, contentPoints: "知识点", freeNote: "" }], opening: "该生今日", ending: "建议", lockedFields: [], isBuiltin: false, createdAt: 0 };
const student: Student = { name: "张三", grade: "初三", personality: "", weaknesses: "", parentFocus: "", createdAt: 0 };

describe("generateFeedback", () => {
  it("parses JSON feedback (with code fence)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '```json\n{"feedback":"该生今日表现良好。建议多练。"}\n```' } }], usage: { prompt_tokens: 10, completion_tokens: 20 } }),
    } as any));
    const out = await generateFeedback({ apiKey: "k", profile, student, courseContent: "讲了幂函数", history: [] as Feedback[] });
    expect(out.feedback).toBe("该生今日表现良好。建议多练。");
  });

  it("parses plain JSON without fence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"feedback":"plain text"}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
    } as any));
    const out = await generateFeedback({ apiKey: "k", profile, student, courseContent: "x", history: [] });
    expect(out.feedback).toBe("plain text");
  });
});
