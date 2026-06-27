import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("schema v2", () => {
  it("suggestions store works", async () => {
    const id = await db.suggestions.add({
      specProfileId: 1, type: "style", field: "opening",
      current: "该生今日", proposal: "【学生姓名】今日",
      observed: "老师常改成名字", evidenceCount: 5,
      status: "pending", createdAt: Date.now()
    });
    expect(id).toBeGreaterThan(0);
    const got = await db.suggestions.get(id);
    expect(got?.proposal).toBe("【学生姓名】今日");
  });

  it("student defaultSubject field persists", async () => {
    const id = await db.students.add({
      name: "张三", grade: "初三", personality: "", weaknesses: "",
      parentFocus: "", defaultSubject: "数学", createdAt: Date.now()
    });
    const got = await db.students.get(id);
    expect(got?.defaultSubject).toBe("数学");
  });
});
