import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { listLearningFeedbacksByStudent, listFeedbacksByStudent } from "../../src/hooks/useFeedbacks";

beforeEach(async () => { await db.delete(); await db.open(); });

async function addStudent() {
  return db.students.add({ name: "张三", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: Date.now() });
}

describe("listLearningFeedbacksByStudent", () => {
  it("returns only includeInLearning feedbacks, last 10", async () => {
    const sid = await addStudent();
    for (let i = 0; i < 12; i++) {
      await db.feedbacks.add({ studentId: sid, subject: "数学", specProfileId: 1, courseContent: "", aiOriginal: "", finalText: `f${i}`, includeInLearning: i % 2 === 0, createdAt: i });
    }
    const list = await listLearningFeedbacksByStudent(sid);
    // 12条里偶数下标6条 includeInLearning=true，但 slice(-10) 对已过滤后的6条无影响，仍为6条
    expect(list).toHaveLength(6);
    expect(list.every(f => f.includeInLearning)).toBe(true);
  });

  it("returns empty when no learning feedbacks", async () => {
    const sid = await addStudent();
    const list = await listLearningFeedbacksByStudent(sid);
    expect(list).toHaveLength(0);
  });
});

describe("listFeedbacksByStudent", () => {
  it("returns feedbacks sorted by createdAt ascending (not by primary key)", async () => {
    const sid = await addStudent();
    // 故意乱序插入：先插 createdAt=300，再 100，再 200
    // 主键自增顺序是 [300, 100, 200]，但期望返回 [100, 200, 300]
    await db.feedbacks.add({ studentId: sid, subject: "数学", specProfileId: 1, courseContent: "", aiOriginal: "", finalText: "late", includeInLearning: false, createdAt: 300 });
    await db.feedbacks.add({ studentId: sid, subject: "数学", specProfileId: 1, courseContent: "", aiOriginal: "", finalText: "early", includeInLearning: false, createdAt: 100 });
    await db.feedbacks.add({ studentId: sid, subject: "数学", specProfileId: 1, courseContent: "", aiOriginal: "", finalText: "mid", includeInLearning: false, createdAt: 200 });
    const list = await listFeedbacksByStudent(sid);
    expect(list.map(f => f.finalText)).toEqual(["early", "mid", "late"]);
  });

  it("returns empty array for student with no feedbacks", async () => {
    const sid = await addStudent();
    const list = await listFeedbacksByStudent(sid);
    expect(list).toEqual([]);
  });
});
