import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Feedback, Student } from "../types";
import { getStudent } from "../hooks/useStudents";
import { listFeedbacksByStudent, updateFeedback } from "../hooks/useFeedbacks";

export default function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [list, setList] = useState<Feedback[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const reload = async () => {
    if (!id) return;
    setStudent((await getStudent(Number(id))) ?? null);
    setList(await listFeedbacksByStudent(Number(id)));
  };
  useEffect(() => { reload(); }, [id]);

  const saveEdit = async (fid: number) => { await updateFeedback(fid, { finalText: editText }); setEditId(null); await reload(); };
  const toggleLearn = async (f: Feedback) => { await updateFeedback(f.id!, { includeInLearning: !f.includeInLearning }); await reload(); };

  if (!student) return <div>未找到学生</div>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{student.name} 的历史反馈</h1>
      {list.length === 0 && <p className="text-gray-500 text-sm">暂无历史反馈</p>}
      {list.map(f => (
        <div key={f.id} className="border rounded p-3 space-y-1">
          <p className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleString()} · {f.subject}</p>
          {editId === f.id ? (
            <>
              <textarea className="block w-full border rounded p-2 h-32" value={editText} onChange={e => setEditText(e.target.value)} />
              <button onClick={() => saveEdit(f.id!)} className="text-sm text-blue-600">保存</button>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{f.finalText}</p>
              <div className="flex gap-2 text-sm items-center">
                <button onClick={() => { setEditId(f.id!); setEditText(f.finalText); }} className="text-blue-600">编辑</button>
                <button onClick={() => navigator.clipboard.writeText(f.finalText)} className="text-gray-600">复制</button>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={f.includeInLearning} onChange={() => toggleLearn(f)} /> 纳入学习库
                </label>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
