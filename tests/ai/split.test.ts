import { describe, it, expect, vi } from "vitest";
import { splitCourseContent } from "../../src/ai/split";

describe("splitCourseContent", () => {
  it("splits text by student names", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"张三":"学了幂函数，粗心","李四":"基础弱，概念没懂"}' } }], usage: { prompt_tokens: 10, completion_tokens: 20 } }),
    } as any));
    const out = await splitCourseContent({ apiKey: "k", studentNames: ["张三", "李四"], rawText: "张三今天学了幂函数粗心，李四基础弱概念没懂" });
    expect(out["张三"]).toBe("学了幂函数，粗心");
    expect(out["李四"]).toBe("基础弱，概念没懂");
  });

  it("returns empty string for unmentioned students", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"张三":"内容","王五":""}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
    } as any));
    const out = await splitCourseContent({ apiKey: "k", studentNames: ["张三", "王五"], rawText: "只提了张三" });
    expect(out["王五"]).toBe("");
  });
});
