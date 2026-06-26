import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { exportAll, importAll } from "../../src/backup/export";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("backup", () => {
  it("exports then imports round-trips students", async () => {
    await db.students.add({ name: "张三", grade: "初三", personality: "", weaknesses: "", parentFocus: "", createdAt: 1 });
    const json = await exportAll();
    await db.delete(); await db.open();
    await importAll(json);
    const got = await db.students.toArray();
    expect(got).toHaveLength(1);
    expect(got[0].name).toBe("张三");
  });

  it("round-trips feedbacks and tokenUsage", async () => {
    await db.feedbacks.add({ studentId: 1, subject: "数学", specProfileId: 1, courseContent: "c", aiOriginal: "a", finalText: "f", includeInLearning: false, createdAt: 1 });
    await db.tokenUsage.add({ callType: "generate", promptTokens: 5, completionTokens: 3, timestamp: 1 });
    const json = await exportAll();
    await db.delete(); await db.open();
    await importAll(json);
    expect((await db.feedbacks.toArray()).length).toBe(1);
    expect((await db.tokenUsage.toArray()).length).toBe(1);
  });
});
