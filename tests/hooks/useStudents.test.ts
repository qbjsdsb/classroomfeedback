import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { listStudents, createStudent, updateStudent, deleteStudent, getStudent } from "../../src/hooks/useStudents";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("students", () => {
  it("creates lists updates deletes", async () => {
    const id = await createStudent({ name: "张三", grade: "初三", personality: "x", weaknesses: "y", parentFocus: "z" });
    expect((await listStudents()).length).toBe(1);
    await updateStudent(id, { grade: "高一" });
    expect((await getStudent(id))?.grade).toBe("高一");
    await deleteStudent(id);
    expect((await listStudents()).length).toBe(0);
  });
});
