// tests/db/schema.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("db schema", () => {
  it("stores and reads a student", async () => {
    const id = await db.students.add({
      name: "张三", grade: "初三", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: Date.now()
    });
    const got = await db.students.get(id);
    expect(got?.name).toBe("张三");
  });

  it("stores a spec profile", async () => {
    const id = await db.specProfiles.add({
      subject: "数学", name: "p", tone: "正式书面", styleNote: "",
      segments: [], opening: "", ending: "",
      styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" },
      lockedFields: [], isBuiltin: false, createdAt: Date.now()
    });
    expect(id).toBeGreaterThan(0);
  });

  it("stores a feedback referencing student and profile", async () => {
    const sid = await db.specProfiles.add({
      subject: "数学", name: "p", tone: "正式书面", styleNote: "",
      segments: [], opening: "", ending: "",
      styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" },
      lockedFields: [], isBuiltin: false, createdAt: Date.now()
    });
    const stid = await db.students.add({
      name: "李四", grade: "高一", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: Date.now()
    });
    const fid = await db.feedbacks.add({
      studentId: stid!, subject: "数学", specProfileId: sid!,
      courseContent: "c", aiOriginal: "a", finalText: "f", includeInLearning: true, createdAt: Date.now()
    });
    expect(fid).toBeGreaterThan(0);
  });

  it("stores token usage and settings", async () => {
    await db.tokenUsage.add({ callType: "generate", promptTokens: 10, completionTokens: 5, timestamp: Date.now() });
    await db.settings.add({ apiKey: "k", lastBackupAt: 0 });
    expect((await db.tokenUsage.toArray()).length).toBe(1);
    expect((await db.settings.toArray()).length).toBe(1);
  });
});
