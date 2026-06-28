import { describe, it, expect, vi } from "vitest";
import { analyzeEdits } from "../../src/ai/analyzeEdits";
import { SpecProfile } from "../../src/types";

const profile: SpecProfile = {
  subject: "数学", name: "p", tone: "正式书面", styleNote: "",
  segments: [], opening: "该生今日", ending: "建议",
  styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" },
  lockedFields: [], isBuiltin: false, createdAt: 0,
};

describe("analyzeEdits", () => {
  it("parses suggestions list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"suggestions":[{"field":"opening","current":"该生今日","proposal":"【学生姓名】今日","observed":"老师常把该生改成名字","evidenceCount":8}]}' } }], usage: { prompt_tokens: 100, completion_tokens: 50 } }),
    } as any));
    const diffs = [
      { aiOriginal: "该生今日表现好", finalText: "张三今日表现好" },
      { aiOriginal: "该生今日一般", finalText: "张三今日一般" },
    ];
    const out = await analyzeEdits({ apiKey: "k", profile, diffs });
    expect(out).toHaveLength(1);
    expect(out[0].field).toBe("opening");
    expect(out[0].evidenceCount).toBe(8);
  });

  it("returns empty array when no suggestions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
    } as any));
    const out = await analyzeEdits({ apiKey: "k", profile, diffs: [{ aiOriginal: "x", finalText: "x" }] });
    expect(out).toHaveLength(0);
  });
});
