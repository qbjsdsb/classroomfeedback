import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Feedback, Student } from "../types";
import { listFeedbacksByStudent, updateFeedback, listLearningFeedbacksByStudent } from "../hooks/useFeedbacks";
import { extractProfile, ProfileProposal } from "../ai/extractProfile";
import { getApiKey } from "../hooks/useSettings";
import { getStudent, updateStudent } from "../hooks/useStudents";

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

  const [proposal, setProposal] = useState<ProfileProposal | null>(null);
  const [extractStatus, setExtractStatus] = useState("");

  const doExtract = async () => {
    if (!student?.id) return;
    try {
      setExtractStatus("提炼中…"); setProposal(null);
      const apiKey = await getApiKey();
      if (!apiKey) { setExtractStatus("请先设置 API Key"); return; }
      const list = await listLearningFeedbacksByStudent(student.id);
      if (list.length < 3) { setExtractStatus(`仅 ${list.length} 条可学习反馈，至少需 3 条`); return; }
      const out = await extractProfile({ apiKey, studentName: student.name, feedbackTexts: list.map(f => f.finalText) });
      setProposal(out); setExtractStatus("");
    } catch (e: any) { setExtractStatus("失败：" + e.message); }
    setTimeout(() => setExtractStatus(""), 3000);
  };

  const applyProposal = async (field: "weaknesses" | "personality" | "parentFocus", mode: "append" | "replace") => {
    if (!student?.id || !proposal) return;
    const proposalText = field === "weaknesses" ? proposal.weaknessesProposal : field === "personality" ? proposal.personalityProposal : proposal.parentFocusProposal;
    if (!proposalText) return;
    const newVal = mode === "append" ? (student[field] ? student[field] + "；" + proposalText : proposalText) : proposalText;
    await updateStudent(student.id, { [field]: newVal } as any);
    await reload();
  };

  if (!student) return <div className="text-gray-500">未找到学生</div>;
  return (
    <div className="space-y-3">
      <Link to="/students" className="inline-block text-sm text-blue-600 hover:underline mb-1">← 返回学生列表</Link>
      <h1 className="text-xl font-bold">{student.name} 的历史反馈</h1>
      {list.length === 0 && <p className="text-gray-500 text-sm">暂无历史反馈</p>}
      {list.map(f => (
        <div key={f.id} className="card space-y-1">
          <p className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleString()} · {f.subject}</p>
          {editId === f.id ? (
            <>
              <textarea className="input h-32" value={editText} onChange={e => setEditText(e.target.value)} />
              <button onClick={() => saveEdit(f.id!)} className="btn-ghost">保存</button>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{f.finalText}</p>
              <div className="flex gap-2 text-sm items-center">
                <button onClick={() => { setEditId(f.id!); setEditText(f.finalText); }} className="btn-ghost">编辑</button>
                <button onClick={() => navigator.clipboard.writeText(f.finalText)} className="btn-ghost">复制</button>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={f.includeInLearning} onChange={() => toggleLearn(f)} /> 纳入学习库
                </label>
              </div>
            </>
          )}
        </div>
      ))}
      {student && (
        <div className="card space-y-2">
          <h2 className="font-semibold">AI 提炼学生特征</h2>
          <button onClick={doExtract} className="btn-purple">从反馈提炼特征</button>
          {extractStatus && <p className="text-sm text-purple-600">{extractStatus}</p>}
          {proposal && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">基于 {proposal.sourceFeedbackCount} 条反馈提炼</p>
              {([
                ["weaknesses", "薄弱点", proposal.weaknessesProposal],
                ["personality", "性格特点", proposal.personalityProposal],
                ["parentFocus", "家长关注", proposal.parentFocusProposal],
              ] as const).map(([field, label, text]) => text ? (
                <div key={field} className="border border-purple-200 rounded-md p-2 bg-purple-50 space-y-1">
                  <p className="text-xs font-semibold">{label}提议</p>
                  <p className="text-sm">{text}</p>
                  <p className="text-xs text-gray-500">当前：{student[field] || "（空）"}</p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => applyProposal(field, "append")} className="text-green-600 hover:bg-green-50">采纳追加</button>
                    <button onClick={() => applyProposal(field, "replace")} className="text-blue-600 hover:bg-blue-50">替换</button>
                    <button onClick={() => setProposal({ ...proposal, [field === "weaknesses" ? "weaknessesProposal" : field === "personality" ? "personalityProposal" : "parentFocusProposal"]: "" })} className="text-gray-600 hover:bg-gray-100">忽略</button>
                  </div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
