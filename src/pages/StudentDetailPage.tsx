import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Feedback, Student } from "../types";
import { listFeedbacksByStudent, updateFeedback, listLearningFeedbacksByStudent } from "../hooks/useFeedbacks";
import { extractProfile, ProfileProposal } from "../ai/extractProfile";
import { getApiKey } from "../hooks/useSettings";
import { getStudent, updateStudent } from "../hooks/useStudents";
import { useNotify } from "../hooks/useNotify";
import { EmptyState } from "../components/EmptyState";

export default function StudentDetailPage() {
  const { id } = useParams();
  const notify = useNotify();
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

  const doExtract = async () => {
    if (!student?.id) return;
    const apiKey = await getApiKey();
    if (!apiKey) { notify.error("请先设置 API Key"); return; }
    const list = await listLearningFeedbacksByStudent(student.id);
    if (list.length < 3) { notify.error(`仅 ${list.length} 条可学习反馈，至少需 3 条`); return; }
    const tid = notify.info("提炼中…", { duration: 0 });
    try {
      setProposal(null);
      const out = await extractProfile({ apiKey, studentName: student.name, feedbackTexts: list.map(f => f.finalText) });
      setProposal(out);
      notify.dismiss(tid);
      notify.success(`基于 ${out.sourceFeedbackCount} 条反馈提炼完成`);
    } catch (e: any) { notify.dismiss(tid); notify.error("失败：" + e.message); }
  };

  const applyProposal = async (field: "weaknesses" | "personality" | "parentFocus", mode: "append" | "replace") => {
    if (!student?.id || !proposal) return;
    const proposalText = field === "weaknesses" ? proposal.weaknessesProposal : field === "personality" ? proposal.personalityProposal : proposal.parentFocusProposal;
    if (!proposalText) return;
    const newVal = mode === "append" ? (student[field] ? student[field] + "；" + proposalText : proposalText) : proposalText;
    await updateStudent(student.id, { [field]: newVal } as any);
    await reload();
  };

  if (!student) return <div className="text-text-muted">未找到学生</div>;
  return (
    <div className="space-y-3">
      <div className="page-header">
        <h1 className="text-xl font-bold">{student.name} 的历史反馈</h1>
        <Link to="/students" className="btn-ghost">← 返回学生列表</Link>
      </div>
      {list.length === 0 && (
        <EmptyState title="暂无历史反馈" hint="为该学生生成第一条反馈" action={<Link to="/generate" className="btn-primary">去生成</Link>} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {list.map(f => (
          <div key={f.id} className="card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">
                {new Date(f.createdAt).toLocaleDateString()} · {f.subject}
              </span>
              <label className="text-xs flex items-center gap-1 text-text-muted">
                <input type="checkbox" checked={f.includeInLearning} onChange={() => toggleLearn(f)} /> 学习库
              </label>
            </div>
            {editId === f.id ? (
              <>
                <textarea className="input h-32" value={editText} onChange={e => setEditText(e.target.value)} />
                <button onClick={() => saveEdit(f.id!)} className="btn-ghost text-xs">保存</button>
              </>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">{f.finalText}</p>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => { setEditId(f.id!); setEditText(f.finalText); }} className="btn-ghost">编辑</button>
                  <button onClick={() => navigator.clipboard.writeText(f.finalText)} className="btn-ghost">复制</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {student && (
        <div className="card space-y-2">
          <h2 className="section-title">AI 提炼学生特征</h2>
          <button onClick={doExtract} className="btn-primary">从反馈提炼特征</button>
          {proposal && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">基于 {proposal.sourceFeedbackCount} 条反馈提炼</p>
              {([
                ["weaknesses", "薄弱点", proposal.weaknessesProposal],
                ["personality", "性格特点", proposal.personalityProposal],
                ["parentFocus", "家长关注", proposal.parentFocusProposal],
              ] as const).map(([field, label, text]) => text ? (
                <div key={field} className="card-accent p-2 space-y-1">
                  <p className="text-xs font-semibold">{label}提议</p>
                  <p className="text-sm">{text}</p>
                  <p className="text-xs text-text-muted">当前：{student[field] || "（空）"}</p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => applyProposal(field, "append")} className="text-green-600 hover:bg-green-50">采纳追加</button>
                    <button onClick={() => applyProposal(field, "replace")} className="text-primary hover:bg-primary-surface">替换</button>
                    <button onClick={() => setProposal({ ...proposal, [field === "weaknesses" ? "weaknessesProposal" : field === "personality" ? "personalityProposal" : "parentFocusProposal"]: "" })} className="text-text-muted hover:bg-surface-2">忽略</button>
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
