import { db } from "../db/schema";
import { Feedback, Student } from "../types";

export async function listFeedbacksByStudent(studentId: number): Promise<Feedback[]> {
  return db.feedbacks.where("studentId").equals(studentId).toArray();
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

export async function exportAsTxt(feedbacks: Feedback[], students: Student[]): Promise<string> {
  const nameOf = (id: number) => students.find(s => s.id === id)?.name ?? "未知";
  return feedbacks.map(f => `【${nameOf(f.studentId)}】(${new Date(f.createdAt).toLocaleDateString()})\n${f.finalText}`).join("\n\n");
}
