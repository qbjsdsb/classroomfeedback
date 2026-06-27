import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { listLearningFeedbacksByStudent } from "../../src/hooks/useFeedbacks";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("listLearningFeedbacksByStudent", () => {
  it("returns only includeInLearning feedbacks, last 10", async () => {
    const sid = await db.students.add({ name: "张三", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: Date.now() });
    for (let i = 0; i < 12; i++) {
      await db.feedbacks.add({ studentId: sid, subject: "数学", specProfileId: 1, courseContent: "", aiOriginal: "", finalText: `f${i}`, includeInLearning: i % 2 === 0, createdAt: i });
    }
    const list = await listLearningFeedbacksByStudent(sid);
    // 12条里偶数下标6条 includeInLearning=true，但 slice(-10) 对已过滤后的6条无影响，仍为6条
    expect(list).toHaveLength(6);
    expect(list.every(f => f.includeInLearning)).toBe(true);
  });

  it("returns empty when no learning feedbacks", async () => {
    const sid = await db.students.add({ name: "李四", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: Date.now() });
    const list = await listLearningFeedbacksByStudent(sid);
    expect(list).toHaveLength(0);
  });
});
