import { db } from "../db/schema";
import { Feedback, Student } from "../types";

export async function listFeedbacksByStudent(studentId: number): Promise<Feedback[]> {
  // sortBy("createdAt") 保证按时间升序；where().equals() 默认按主键序，主键顺序≠插入时间顺序
  return db.feedbacks.where("studentId").equals(studentId).sortBy("createdAt");
}
export async function saveFeedback(f: Omit<Feedback, "id" | "createdAt">): Promise<number> {
  return db.feedbacks.add({ ...f, createdAt: Date.now() });
}
export async function updateFeedback(id: number, patch: Partial<Feedback>): Promise<void> {
  await db.feedbacks.update(id, patch);
}
export async function listAllFeedbacks(): Promise<Feedback[]> {
  return db.feedbacks.orderBy("createdAt").toArray();
}
export async function listDiffsByProfile(specProfileId: number): Promise<{ aiOriginal: string; finalText: string }[]> {
  const all = await db.feedbacks.where("specProfileId").equals(specProfileId).toArray();
  return all
    .filter(f => f.includeInLearning && f.aiOriginal !== f.finalText && f.aiOriginal && f.finalText)
    .slice(-50)
    .map(f => ({ aiOriginal: f.aiOriginal, finalText: f.finalText }));
}

export async function listLearningFeedbacksByStudent(studentId: number): Promise<Feedback[]> {
  const all = await db.feedbacks.where("studentId").equals(studentId).toArray();
  return all.filter(f => f.includeInLearning).slice(-10);
}

export async function exportAsTxt(feedbacks: Feedback[], students: Student[]): Promise<string> {
  const nameOf = (id: number) => students.find(s => s.id === id)?.name ?? "未知";
  return feedbacks.map(f => `【${nameOf(f.studentId)}】(${new Date(f.createdAt).toLocaleDateString()})\n${f.finalText}`).join("\n\n");
}

/** 取该学生 + 同科目规范档的历史反馈（用于 few-shot 检索池） */
export async function listFeedbacksForFewShot(
  studentId: number,
  specProfileId: number
): Promise<Feedback[]> {
  // 1. 该学生的所有反馈
  const own = await db.feedbacks.where("studentId").equals(studentId).toArray();
  // 2. 同规范档的其他学生反馈（补充池）
  const sameSpec = await db.feedbacks.where("specProfileId").equals(specProfileId).toArray();
  // 合并去重（按 id）
  const map = new Map<number, Feedback>();
  [...own, ...sameSpec].forEach(f => { if (f.id !== undefined) map.set(f.id, f); });
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}
