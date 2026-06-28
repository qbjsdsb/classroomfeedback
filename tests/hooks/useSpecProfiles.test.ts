import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { listProfiles, listProfilesBySubject } from "../../src/hooks/useSpecProfiles";

beforeEach(async () => {
  await db.delete();
  await db.open();
  // 准备测试数据：3 个规范档，subject 分别为 通用/通用/数学
  await db.specProfiles.bulkAdd([
    { subject: "通用", name: "简短", tone: "口语", styleNote: "", segments: [], opening: "", ending: "", styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" }, lockedFields: [], isBuiltin: true, createdAt: 1 },
    { subject: "通用", name: "正式", tone: "正式书面", styleNote: "", segments: [], opening: "", ending: "", styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" }, lockedFields: [], isBuiltin: true, createdAt: 2 },
    { subject: "数学", name: "数学专用", tone: "半书面", styleNote: "", segments: [], opening: "", ending: "", styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" }, lockedFields: [], isBuiltin: false, createdAt: 3 },
  ]);
});

describe("listProfiles", () => {
  it("returns all profiles", async () => {
    const list = await listProfiles();
    expect(list).toHaveLength(3);
  });
});

describe("listProfilesBySubject", () => {
  it("returns profiles matching the subject", async () => {
    const list = await listProfilesBySubject("数学");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("数学专用");
  });

  it("returns all profiles when subject is empty", async () => {
    const list = await listProfilesBySubject("");
    expect(list).toHaveLength(3);
  });

  it("falls back to ALL profiles when no profile matches the subject (avoid user lockout)", async () => {
    // 学生填了 defaultSubject="英语"，但系统里没有任何 subject="英语" 的规范档
    // 旧行为：返回 []，导致下拉框空，用户无法生成反馈
    // 新行为：回退到全部规范档，让用户至少能选
    const list = await listProfilesBySubject("英语");
    expect(list).toHaveLength(3);
  });
});
