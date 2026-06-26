import { db } from "../db/schema";
import { Feedback } from "../types";

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
