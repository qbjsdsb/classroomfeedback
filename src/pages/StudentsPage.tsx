import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Student } from "../types";
import { listStudents, createStudent, updateStudent, deleteStudent } from "../hooks/useStudents";
import { useNotify } from "../hooks/useNotify";
import { EmptyState } from "../components/EmptyState";

const EMPTY: Omit<Student, "id" | "createdAt"> = { name: "", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "" };

export default function StudentsPage() {
  const notify = useNotify();
  const [list, setList] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id" | "createdAt">>(EMPTY);
  const reload = async () => setList(await listStudents());
  useEffect(() => { reload(); }, []);

  const startNew = () => { setEditing(null); setForm(EMPTY); };
  const startEdit = (s: Student) => { setEditing(s); setForm({ name: s.name, grade: s.grade, personality: s.personality, weaknesses: s.weaknesses, parentFocus: s.parentFocus, defaultSubject: s.defaultSubject }); };
  const submit = async () => {
    if (editing?.id) await updateStudent(editing.id, form);
    else await createStudent(form);
    setForm(EMPTY); setEditing(null); await reload();
    notify.success("已保存");
  };
  const remove = async (id: number) => {
    const ok = await notify.confirm("删除学生", "确认删除该学生？此操作不可撤销。");
    if (ok) { await deleteStudent(id); await reload(); notify.success("已删除"); }
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="text-xl font-bold">学生管理</h1>
        <button onClick={startNew} className="btn-primary">+ 新建</button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="暂无学生" hint="添加你的第一个学生档案" action={<button className="btn-primary" onClick={startNew}>新建学生</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {list.map(s => (
            <div key={s.id} className="card card-hover flex justify-between items-center">
              <span><NavLink to={`/students/${s.id}`} className="text-primary">{s.name}</NavLink>（{s.grade}）</span>
              <span className="space-x-2 text-sm">
                <button onClick={() => startEdit(s)} className="btn-ghost">编辑</button>
                <button onClick={() => remove(s.id!)} className="btn-danger">删除</button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="card space-y-2">
        <h2 className="section-title">{editing ? "编辑" : "新建"}学生</h2>
        <div className="form-field">
          <label className="label">姓名</label>
          <input className="input" placeholder="姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">年级</label>
          <input className="input" placeholder="年级" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">性格特点</label>
          <textarea className="input" placeholder="性格特点" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">薄弱点</label>
          <textarea className="input" placeholder="薄弱点" value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">家长关注点</label>
          <textarea className="input" placeholder="家长关注点" value={form.parentFocus} onChange={e => setForm({ ...form, parentFocus: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="label">常用科目（可选，如数学）</label>
          <input className="input" placeholder="常用科目（可选，如数学）" value={form.defaultSubject} onChange={e => setForm({ ...form, defaultSubject: e.target.value })} />
        </div>
        <button onClick={submit} className="btn-primary">保存</button>
      </div>
    </div>
  );
}
