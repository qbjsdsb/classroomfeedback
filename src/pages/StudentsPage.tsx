import { useEffect, useState } from "react";
import { Student } from "../types";
import { listStudents, createStudent, updateStudent, deleteStudent } from "../hooks/useStudents";

const EMPTY: Omit<Student, "id" | "createdAt"> = { name: "", grade: "", personality: "", weaknesses: "", parentFocus: "" };

export default function StudentsPage() {
  const [list, setList] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id" | "createdAt">>(EMPTY);
  const reload = async () => setList(await listStudents());
  useEffect(() => { reload(); }, []);

  const startNew = () => { setEditing(null); setForm(EMPTY); };
  const startEdit = (s: Student) => { setEditing(s); setForm({ name: s.name, grade: s.grade, personality: s.personality, weaknesses: s.weaknesses, parentFocus: s.parentFocus }); };
  const submit = async () => {
    if (editing?.id) await updateStudent(editing.id, form);
    else await createStudent(form);
    setForm(EMPTY); setEditing(null); await reload();
  };
  const remove = async (id: number) => { if (confirm("确认删除该学生？")) { await deleteStudent(id); await reload(); } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">学生管理</h1>
        <button onClick={startNew} className="text-sm text-blue-600">+ 新建</button>
      </div>
      <ul className="divide-y">
        {list.map(s => (
          <li key={s.id} className="py-2 flex justify-between">
            <span>{s.name}（{s.grade}）</span>
            <span className="space-x-2 text-sm">
              <button onClick={() => startEdit(s)} className="text-blue-600">编辑</button>
              <button onClick={() => remove(s.id!)} className="text-red-600">删除</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="border rounded p-3 space-y-2">
        <h2 className="font-semibold">{editing ? "编辑" : "新建"}学生</h2>
        <input className="block w-full border rounded p-2" placeholder="姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="block w-full border rounded p-2" placeholder="年级" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
        <textarea className="block w-full border rounded p-2" placeholder="性格特点" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
        <textarea className="block w-full border rounded p-2" placeholder="薄弱点" value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} />
        <textarea className="block w-full border rounded p-2" placeholder="家长关注点" value={form.parentFocus} onChange={e => setForm({ ...form, parentFocus: e.target.value })} />
        <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
      </div>
    </div>
  );
}
