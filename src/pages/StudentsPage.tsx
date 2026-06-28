import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Student } from "../types";
import { listStudents, createStudent, updateStudent, deleteStudent } from "../hooks/useStudents";
import { useNotify } from "../hooks/useNotify";
import { EmptyState } from "../components/EmptyState";
import { Users } from "lucide-react";

const EMPTY: Omit<Student, "id" | "createdAt"> = { name: "", grade: "", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "" };

export default function StudentsPage() {
  const notify = useNotify();
  const [list, setList] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id" | "createdAt">>(EMPTY);
  const reload = async () => setList(await listStudents());
  useEffect(() => { reload(); }, []);

  const startNew = () => { setEditing({} as Student); setForm(EMPTY); };
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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title text-xl font-bold">学生管理</h1>
        <button onClick={startNew} className="btn-primary">+ 新建</button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Users} title="暂无学生" hint="添加你的第一个学生档案" action={<button className="btn-primary" onClick={startNew}>新建学生</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(s => (
            <div key={s.id} className="card card-hover flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <NavLink to={`/students/${s.id}`} className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary-surface text-primary flex items-center justify-center font-semibold">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text truncate hover:text-primary">{s.name}</h3>
                    <p className="text-xs text-text-muted">{s.grade || "未填年级"}</p>
                  </div>
                </NavLink>
                {s.defaultSubject && (
                  <span className="shrink-0 bg-primary-surface text-primary text-xs px-2 py-0.5 rounded-md">
                    {s.defaultSubject}
                  </span>
                )}
              </div>
              {s.weaknesses && (
                <p className="mt-3 text-sm text-text-muted line-clamp-2 flex-1">{s.weaknesses}</p>
              )}
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <button onClick={() => startEdit(s)} className="btn-ghost text-xs">编辑</button>
                <button onClick={() => remove(s.id!)} className="btn-ghost text-xs text-red-600">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <>
          <div className="card space-y-4">
            <h2 className="section-title">{editing.id ? "编辑" : "新建"}学生</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label className="label">姓名</label>
                <input className="input" placeholder="姓名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="label">年级</label>
                <input className="input" placeholder="年级" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label className="label">常用科目（可选，如数学）</label>
              <input className="input" placeholder="常用科目" value={form.defaultSubject} onChange={e => setForm({ ...form, defaultSubject: e.target.value })} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">学习情况</h2>
            <div className="form-field">
              <label className="label">性格特点</label>
              <textarea className="input" rows={2} placeholder="性格特点" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="label">薄弱点</label>
              <textarea className="input" rows={2} placeholder="薄弱点" value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">家长沟通</h2>
            <div className="form-field">
              <label className="label">家长关注点</label>
              <textarea className="input" rows={2} placeholder="家长关注点" value={form.parentFocus} onChange={e => setForm({ ...form, parentFocus: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={submit} className="btn-primary px-4 py-2">保存</button>
            <button onClick={() => setEditing(null)} className="btn-soft px-4 py-2">取消</button>
          </div>
        </>
      )}
    </div>
  );
}
