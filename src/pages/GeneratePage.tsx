import { useEffect, useState } from "react";
import { Student, SpecProfile } from "../types";
import { listStudents } from "../hooks/useStudents";
import { listProfiles, listProfilesBySubject } from "../hooks/useSpecProfiles";
import { listFeedbacksByStudent, saveFeedback } from "../hooks/useFeedbacks";
import { useRecording } from "../hooks/useRecording";
import { isDesktop } from "../lib/device";
import { correctText } from "../ai/correct";
import { generateFeedback } from "../ai/generate";
import { getApiKey } from "../hooks/useSettings";
import { loadDraft, saveDraft, clearDraft } from "../hooks/useDraft";
import { useNotify } from "../hooks/useNotify";

const TEMPLATES = ["【学生姓名】", "【今日知识点】", "【课堂表现】", "【家庭建议】"];

export default function GeneratePage() {
  const notify = useNotify();
  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<SpecProfile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<SpecProfile[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState("");
  const [editing, setEditing] = useState("");

  useEffect(() => {
    (async () => {
      setStudents(await listStudents());
      setProfiles(await listProfiles());
      setText(await loadDraft());
    })();
  }, []);
  useEffect(() => { saveDraft(text); }, [text]);
  useEffect(() => { setAvailableProfiles(profiles); }, [profiles]);
  useEffect(() => {
    (async () => {
      const student = students.find(s => s.id === studentId);
      if (student?.defaultSubject) setAvailableProfiles(await listProfilesBySubject(student.defaultSubject));
      else setAvailableProfiles(profiles);
      setProfileId(null);
    })();
  }, [studentId, students, profiles]);

  const onFinal = (chunk: string) => setText(t => t + chunk);
  const { supported, recording, interim, start, stop } = useRecording(onFinal);

  const doCorrect = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) { notify.error("请先设置 API Key"); return; }
    const student = students.find(s => s.id === studentId);
    setCorrecting(true);
    const tid = notify.info("纠错中…", { duration: 0 });
    try {
      const out = await correctText({ apiKey, rawText: text, studentNames: student ? [student.name] : [], subjectTerms: [] });
      setText(out);
      notify.dismiss(tid);
      notify.success("纠错完成");
    } catch (e: any) { notify.dismiss(tid); notify.error("纠错失败：" + e.message); }
    finally { setCorrecting(false); }
  };

  const doGenerate = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) { notify.error("请先设置 API Key"); return; }
    const student = students.find(s => s.id === studentId);
    const profile = profiles.find(p => p.id === profileId);
    if (!student || !profile) { notify.error("请选择学生和规范档"); return; }
    setGenerating(true); setPreview("");
    const tid = notify.info("生成中…", { duration: 0 });
    try {
      const history = student.id ? await listFeedbacksByStudent(student.id) : [];
      const out = await generateFeedback({ apiKey, profile, student, courseContent: text, history, includedSegments: profile.segments });
      setPreview(out.feedback); setEditing(out.feedback);
      notify.dismiss(tid);
      notify.success("生成完成");
    } catch (e: any) { notify.dismiss(tid); notify.error("生成失败：" + e.message + "（可重试或手动编写）"); }
    finally { setGenerating(false); }
  };

  const doSave = async () => {
    const student = students.find(s => s.id === studentId);
    const profile = profiles.find(p => p.id === profileId);
    if (!student?.id || !profile?.id) return;
    await saveFeedback({
      studentId: student.id, subject: profile.subject, specProfileId: profile.id,
      courseContent: text, aiOriginal: preview, finalText: editing, includeInLearning: false,
    });
    notify.success("已保存（已记录 AI 原文与你的修改，供未来学习）");
    clearDraft(); setText(""); setPreview(""); setEditing("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">生成反馈</h1>
      <div className="grid grid-cols-2 gap-2">
        <select value={studentId ?? ""} onChange={e => setStudentId(Number(e.target.value))} className="input">
          <option value="">选择学生…</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={profileId ?? ""} onChange={e => setProfileId(Number(e.target.value))} className="input">
          <option value="">选择规范档…</option>
          {availableProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map(t => <button key={t} onClick={() => setText(text + t)} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</button>)}
          {isDesktop() && supported && (
            <button onClick={recording ? stop : start} className={`text-xs px-2 py-1 rounded ${recording ? "bg-red-500 text-white" : "bg-blue-100"}`}>
              {recording ? "停止录音" : "开始录音"}
            </button>
          )}
        </div>
        {recording && interim && <p className="text-xs text-gray-500">实时：{interim}</p>}
        <textarea className="input h-40" placeholder="录音转写或手动输入本节课内容…" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={doCorrect} disabled={correcting || !text} className="btn-soft">
          {correcting ? "纠错中…" : "AI 纠错"}
        </button>
      </div>

      <button onClick={doGenerate} disabled={generating || !text || !studentId || !profileId} className="btn-primary">
        {generating ? "正在生成…" : "生成反馈"}
      </button>

      {preview && (
        <div className="card space-y-2">
          <h2 className="font-semibold">预览（可编辑）</h2>
          <textarea className="input h-48" value={editing} onChange={e => setEditing(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={doGenerate} disabled={generating} className="btn-ghost">重新生成</button>
            <button onClick={doSave} className="btn-success">确认保存</button>
            <button onClick={() => navigator.clipboard.writeText(editing)} className="btn-soft">复制</button>
          </div>
        </div>
      )}
    </div>
  );
}
