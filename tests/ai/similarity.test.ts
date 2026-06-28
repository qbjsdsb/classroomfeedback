import { describe, it, expect } from "vitest";
import { similarity, selectTopN } from "../../src/ai/similarity";

describe("similarity", () => {
  it("完全相同返回 1", () => {
    expect(similarity("今天学了数学应用题", "今天学了数学应用题")).toBe(1);
  });

  it("完全无重叠返回 0", () => {
    expect(similarity("今天学了数学", "abcdefg")).toBe(0);
  });

  it("空字符串返回 0", () => {
    expect(similarity("", "今天")).toBe(0);
    expect(similarity("今天", "")).toBe(0);
    expect(similarity("", "")).toBe(0);
  });

  it("尾部单字轻微影响但主体高重叠", () => {
    // 滑窗 token 主体重叠，尾部多一字轻微拉低相似度但仍然较高
    expect(similarity("数学应用题", "数学应用题的")).toBeGreaterThan(0.7);
  });

  it("部分重叠返回 0-1 之间", () => {
    const s = similarity("今天学数学应用题", "明天学语文阅读理解");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it("英文/数字也参与相似度", () => {
    expect(similarity("学了 Chapter 3", "复习 Chapter 3")).toBeGreaterThan(0);
  });
});

describe("selectTopN", () => {
  const candidates = [
    { id: 1, text: "今天学了数学应用题", studentId: 10, subject: "数学" },
    { id: 2, text: "复习语文古诗词", studentId: 20, subject: "语文" },
    { id: 3, text: "数学函数练习", studentId: 10, subject: "数学" },
    { id: 4, text: "英语听力训练", studentId: 30, subject: "英语" },
  ];

  it("按分数降序取 topN", () => {
    const result = selectTopN("数学应用题", candidates, { topN: 2 });
    expect(result.length).toBe(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it("score > 0 过滤", () => {
    // "数学应用题" 和 "英语听力训练" 无中文重叠
    const result = selectTopN("数学应用题", candidates, { topN: 10 });
    expect(result.every(r => r.score > 0)).toBe(true);
  });

  it("preferSameStudent 加权", () => {
    // 学生 20 的反馈（"复习语文古诗词"）和查询 "数学应用题" 基础相似度为 0
    // 无 preferSameStudent 时被 score>0 过滤掉；加 preferSameStudent=20 后 score=0.3 被保留选中
    const withoutPref = selectTopN("数学应用题", candidates, { topN: 10, preferSameStudent: undefined });
    const withPref = selectTopN("数学应用题", candidates, { topN: 10, preferSameStudent: 20 });
    expect(withoutPref.find(r => r.id === 2)).toBeUndefined();
    expect(withPref.find(r => r.id === 2)).toBeDefined();
    expect(withPref.find(r => r.id === 2)!.score).toBeGreaterThan(0);
  });

  it("preferSameSubject 加权", () => {
    const withoutPref = selectTopN("应用题", candidates, { topN: 10, preferSameSubject: undefined });
    const withPref = selectTopN("应用题", candidates, { topN: 10, preferSameSubject: "数学" });
    // 学生 10 的两条都是数学，应被加权
    expect(withPref[0].score).toBeGreaterThanOrEqual(withoutPref[0].score);
  });
});
