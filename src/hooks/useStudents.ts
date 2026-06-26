import { db } from "../db/schema";
import { Student } from "../types";

export async function listStudents(): Promise<Student[]> {
  return db.students.orderBy("createdAt").toArray();
}
export async function createStudent(data: Omit<Student, "id" | "createdAt">): Promise<number> {
  return db.students.add({ ...data, createdAt: Date.now() });
}
export async function getStudent(id: number): Promise<Student | undefined> {
  return db.students.get(id);
}
export async function updateStudent(id: number, patch: Partial<Student>): Promise<void> {
  await db.students.update(id, patch);
}
export async function deleteStudent(id: number): Promise<void> {
  await db.students.delete(id);
}
