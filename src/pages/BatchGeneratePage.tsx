// src/pages/BatchGeneratePage.tsx
import { useEffect, useState } from "react";
import { Student, SpecProfile, Feedback } from "../types";
import { listStudents } from "../hooks/useStudents";
import { listProfiles } from "../hooks/useSpecProfiles";
import { listFeedbacksByStudent, saveFeedback } from "../hooks/useFeedbacks";
import { useRecording } from "../hooks/useRecording";
import { isDesktop } from "../lib/device";
import { correctText } from "../ai/correct";
import { splitCourseContent } from "../ai/split";
import { generateFeedback } from "../ai/generate";
import { getApiKey } from "../hooks/useSettings";

type Step = "input" | "splitConfirm" | "result";
interface PerStudent {
  student: Student;
  content: string;
  status: "pending" | "generating" | "done" | "error";
  feedback: string;
  aiOriginal: string;
  error: string;
}

export default function BatchGeneratePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<SpecProfile[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [perStudent, setPerStudent] = useState<PerStudent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setStudents(await listStudents());
      setProfiles(await listProfiles());
    })();
  }, []);

  const onFinal = (chunk: string) => setText(t => t + chunk);
  const { supported, recording, interim, start, stop } = useRecording(onFinal);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const doCorrect = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) { setError("请先设置 API Key"); return; }
    const names = students.filter(s => selectedStudentIds.includes(s.id!)).map(s => s.name);
    setBusy(true); setError("");
    try {
      const out = await correctText({ apiKey, rawText: text, studentNames: names, subjectTerms: [] });
      setText(out);
    } catch (e: any) { setError("纠错失败：" + e.message); }
    finally { setBusy(false); }
  };

  const doSplit = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) { setError("请先设置 API Key"); return; }
    if (selectedStudentIds.length === 0) { setError("请至少选一个学生"); return; }
    if (!profileId) { setError("请选规范档"); return; }
    if (!text.trim()) { setError("请输入课程内容"); return; }
    const chosen = students.filter(s => selectedStudentIds.includes(s.id!));
    setBusy(true); setError("");
    try {
      const split = await splitCourseContent({ apiKey, studentNames: chosen.map(s => s.name), rawText: text });
      setPerStudent(chosen.map(s => ({
        student: s, content: split[s.name] ?? "", status: "pending", feedback: "", aiOriginal: "", error: ""
      })));
      setStep("splitConfirm");
    } catch (e: any) { setError("拆分失败：" + e.message); }
    finally { setBusy(false); }
  };

  const generateOne = async (idx: number, apiKey: string, profile: SpecProfile, historyMap: Record<number, Feedback[]>) => {
    const ps = perStudent[idx];
    if (!ps.student.id) return;
    setPerStudent(prev => prev.map((p, i) => i === idx ? { ...p, status: "generating", error: "" } : p));
    try {
      const history = historyMap[ps.student.id] ?? [];
      const out = await generateFeedback({ apiKey, profile, student: ps.student, courseContent: ps.content, history });
      setPerStudent(prev => prev.map((p, i) => i === idx ? { ...p, status: "done", feedback: out.feedback, aiOriginal: out.feedback } : p));
    } catch (e: any) {
      setPerStudent(prev => prev.map((p, i) => i === idx ? { ...p, status: "error", error: e.message } : p));
    }
  };

  const doBatchGenerate = async () => {
    const apiKey = await getApiKey();
    const profile = profiles.find(p => p.id === profileId);
    if (!apiKey || !profile) return;
    setBusy(true); setError("");
    const historyMap: Record<number, Feedback[]> = {};
    for (const ps of perStudent) {
      if (ps.student.id) historyMap[ps.student.id] = await listFeedbacksByStudent(ps.student.id);
    }
    for (let i = 0; i < perStudent.length; i++) {
      await generateOne(i, apiKey, profile, historyMap);
    }
    setBusy(false);
    setStep("result");
  };

  const retryOne = async (idx: number) => {
    const apiKey = await getApiKey();
    const profile = profiles.find(p => p.id === profileId);
    if (!apiKey || !profile) return;
    const sid = perStudent[idx].student.id;
    if (!sid) return;
    setBusy(true);
    const history = await listFeedbacksByStudent(sid);
    const historyMap: Record<number, Feedback[]> = { [sid]: history };
    await generateOne(idx, apiKey, profile, historyMap);
    setBusy(false);
  };

  const saveAll = async () => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile?.id) return;
    let count = 0;
    for (const ps of perStudent) {
      if (ps.status === "done" && ps.student.id) {
        await saveFeedback({
          studentId: ps.student.id, subject: profile.subject, specProfileId: profile.id,
          courseContent: ps.content, aiOriginal: ps.aiOriginal, finalText: ps.feedback, includeInLearning: false,
        });
        count++;
      }
    }
    alert("已保存 " + count + " 条反馈");
    setStep("input"); setText(""); setPerStudent([]); setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">批量生成反馈</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {step === "input" && (
        <div className="space-y-3">
          <div>
            <span className="text-sm font-semibold">选学生（可多选）</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {students.map(s => (
                <label key={s.id} className={`border rounded px-2 py-1 text-sm cursor-pointer ${selectedStudentIds.includes(s.id!) ? "bg-blue-100 border-blue-400" : ""}`}>
                  <input type="checkbox" className="mr-1" checked={selectedStudentIds.includes(s.id!)} onChange={() => toggleStudent(s.id!)} />
                  {s.name}
                </label>
              ))}
              {students.length > 5 && <span className="text-xs text-gray-500 self-center">超过5个会较慢，建议分批</span>}
            </div>
          </div>
          <div>
            <label className="label">规范档</label>
            <select value={profileId ?? ""} onChange={e => setProfileId(Number(e.target.value))} className="input">
              <option value="">选择规范档…</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}（{p.subject}）</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isDesktop() && supported && (
              <button onClick={recording ? stop : start} className={`text-xs px-2 py-1 rounded ${recording ? "bg-red-500 text-white" : "bg-blue-100"}`}>
                {recording ? "停止录音" : "开始录音"}
              </button>
            )}
          </div>
          {recording && interim && <p className="text-xs text-gray-500">实时：{interim}</p>}
          <textarea className="input h-40" placeholder="点名口述整节课：张三今天…；李四今天…" value={text} onChange={e => setText(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={doCorrect} disabled={busy || !text} className="btn-soft">{busy ? "处理中…" : "AI 纠错"}</button>
            <button onClick={doSplit} disabled={busy} className="btn-primary">{busy ? "拆分中…" : "拆分并确认"}</button>
          </div>
        </div>
      )}

      {step === "splitConfirm" && (
        <div className="space-y-3">
          <h2 className="font-semibold">确认拆分（可手动调整每个学生的内容）</h2>
          {perStudent.map((ps, i) => (
            <div key={ps.student.id} className="card p-2 space-y-1">
              <p className="font-semibold text-sm">{ps.student.name}</p>
              <textarea className="input h-20 text-sm" value={ps.content}
                onChange={e => setPerStudent(prev => prev.map((p, j) => j === i ? { ...p, content: e.target.value } : p))} />
              {ps.content === "" && <p className="text-xs text-orange-600">未识别到内容，请手动补充</p>}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep("input")} className="text-sm text-gray-600 hover:text-gray-800">返回修改</button>
            <button onClick={doBatchGenerate} disabled={busy} className="btn-primary">
              {busy ? `正在生成…（${perStudent.filter(p => p.status === "done" || p.status === "error").length}/${perStudent.length}）` : "批量生成"}
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-3">
          <h2 className="font-semibold">生成结果（可编辑，单个可重试）</h2>
          {perStudent.map((ps, i) => (
            <div key={ps.student.id} className="card space-y-1">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{ps.student.name}</p>
                <span className={`text-xs ${ps.status === "done" ? "text-green-600" : ps.status === "error" ? "text-red-600" : "text-gray-500"}`}>
                  {ps.status === "done" ? "已生成" : ps.status === "error" ? "失败" : "待生成"}
                </span>
              </div>
              {ps.status === "error" && <p className="text-xs text-red-600">{ps.error}</p>}
              {ps.status === "done" && (
                <textarea className="input h-32 text-sm" value={ps.feedback}
                  onChange={e => setPerStudent(prev => prev.map((p, j) => j === i ? { ...p, feedback: e.target.value } : p))} />
              )}
              <div className="flex gap-2 text-sm">
                {ps.status === "error" && <button onClick={() => retryOne(i)} disabled={busy} className="btn-ghost">重试</button>}
                {ps.status === "done" && <button onClick={() => retryOne(i)} disabled={busy} className="btn-ghost">重新生成</button>}
                {ps.status === "done" && <button onClick={() => navigator.clipboard.writeText(ps.feedback)} className="btn-soft">复制</button>}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep("splitConfirm")} className="text-sm text-gray-600 hover:text-gray-800">返回拆分确认</button>
            <button onClick={saveAll} className="btn-success">批量保存（仅保存已生成的）</button>
          </div>
        </div>
      )}
    </div>
  );
}
