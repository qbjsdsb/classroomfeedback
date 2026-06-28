import { describe, it, expect } from "vitest";
import { vi } from "vitest";

// mock callDeepSeek
vi.mock("../../src/ai/client", () => ({
  callDeepSeek: vi.fn(),
}));

import { callDeepSeek } from "../../src/ai/client";
import { learnSpec } from "../../src/ai/learn";

describe("learnSpec styleFeatures 解析", () => {
  it("完整 styleFeatures 正确解析", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "正式书面", styleNote: "正式", segments: [],
        opening: "开头", ending: "结尾",
        styleFeatures: {
          warmth: 4, formality: 5, conciseness: 2, encouragement: 3,
          addressStyle: "XX家长您好", punctuation: "规范标点",
          sentencePattern: "长短句结合",
        },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(4);
    expect(result.styleFeatures.formality).toBe(5);
    expect(result.styleFeatures.addressStyle).toBe("XX家长您好");
  });

  it("styleFeatures 缺失时补默认值", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(3);
    expect(result.styleFeatures.formality).toBe(3);
    expect(result.styleFeatures.addressStyle).toBe("");
  });

  it("数值超范围 clamp 到 1-5", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        styleFeatures: { warmth: 10, formality: 0, conciseness: 3, encouragement: 3 },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(5);
    expect(result.styleFeatures.formality).toBe(1);
  });

  it("非数值字符串解析为数字", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        styleFeatures: { warmth: "4", formality: "3", conciseness: 3, encouragement: 3 },
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.styleFeatures.warmth).toBe(4);
    expect(result.styleFeatures.formality).toBe(3);
  });

  it("segment format 合法值正确解析", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [
          { title: "课堂内容", targetWords: 80, contentPoints: "知识点", freeNote: "", format: "title" },
          { title: "学生表现", targetWords: 100, contentPoints: "表现", freeNote: "", format: "number" },
        ],
        opening: "", ending: "",
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.segments.length).toBe(2);
    expect(result.segments[0].format).toBe("title");
    expect(result.segments[1].format).toBe("number");
  });

  it("segment format 缺失时补默认 none", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [
          { title: "课堂内容", targetWords: 80, contentPoints: "知识点", freeNote: "" },
        ],
        opening: "", ending: "",
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.segments[0].format).toBe("none");
  });

  it("segment format 非法值时补默认 none", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [
          { title: "课堂内容", targetWords: 80, contentPoints: "知识点", freeNote: "", format: "bold" },
        ],
        opening: "", ending: "",
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.segments[0].format).toBe("none");
  });

  it("exemplarSamples 正确解析", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        exemplarSamples: ["这是第一条代表性样本", "这是第二条代表性样本"],
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.exemplarSamples.length).toBe(2);
    expect(result.exemplarSamples[0]).toBe("这是第一条代表性样本");
    expect(result.exemplarSamples[1]).toBe("这是第二条代表性样本");
  });

  it("exemplarSamples 缺失或非数组时返回空数组", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        // exemplarSamples 缺失
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.exemplarSamples).toEqual([]);

    // 非数组
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        exemplarSamples: "不是数组",
      }),
    });
    const result2 = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result2.exemplarSamples).toEqual([]);
  });

  it("exemplarSamples 过滤非字符串和空串，最多取 2 条", async () => {
    (callDeepSeek as any).mockResolvedValue({
      content: JSON.stringify({
        tone: "半书面", styleNote: "", segments: [],
        opening: "", ending: "",
        exemplarSamples: ["有效样本", 123, "", "   ", "第二条有效", "第三条"],
      }),
    });
    const result = await learnSpec({ apiKey: "k", samples: ["样本"] });
    expect(result.exemplarSamples).toEqual(["有效样本", "第二条有效"]);
  });
});
