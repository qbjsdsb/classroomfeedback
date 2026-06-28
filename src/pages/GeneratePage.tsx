import { useEffect, useState } from "react";
import { Student, SpecProfile } from "../types";
import { listStudents } from "../hooks/useStudents";
import { listProfiles, listProfilesBySubject } from "../hooks/useSpecProfiles";
import { listFeedbacksForFewShot, saveFeedback } from "../hooks/useFeedbacks";
import { useRecording } from "../hooks/useRecording";
import { isDesktop } from "../lib/device";
import { correctText } from "../ai/correct";
import { generateFeedback } from "../ai/generate";
import { getApiKey } from "../hooks/useSettings";
import { loadDraft, saveDraft, clearDraft } from "../hooks/useDraft";
import { useNotify } from "../hooks/useNotify";
import { Select } from "../components/Select";

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
  const [segIncluded, setSegIncluded] = useState<Set<number>>(new Set());
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
    const p = profiles.find(p => p.id === profileId);
    if (p) setSegIncluded(new Set(p.segments.map((_, i) => i)));
    else setSegIncluded(new Set());
  }, [profileId, profiles]);
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
    const includedSegments = profile.segments.filter((_, i) => segIncluded.has(i));
    if (includedSegments.length === 0) { notify.error("请至少选择一个段落"); return; }
    setGenerating(true); setPreview("");
    const tid = notify.info("生成中…", { duration: 0 });
    try {
      const history = student.id && profile.id ? await listFeedbacksForFewShot(student.id, profile.id) : [];
      const out = await generateFeedback({ apiKey, profile, student, courseContent: text, history, includedSegments });
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
      <div className="page-header">
        <h1 className="text-xl font-bold">生成反馈</h1>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={studentId}
          options={students.filter(s => s.id != null).map(s => ({ value: s.id!, label: s.name }))}
          placeholder="选择学生…"
          onChange={(v) => setStudentId(v)}
        />
        <Select
          value={profileId}
          options={availableProfiles.filter(p => p.id != null).map(p => ({ value: p.id!, label: p.name }))}
          placeholder="选择规范档…"
          onChange={(v) => setProfileId(v)}
        />
      </div>

      {(() => {
        const p = profiles.find(p => p.id === profileId);
        if (!p || p.segments.length === 0) return null;
        return (
          <div className="card-accent p-2 space-y-1">
            <p className="text-sm font-semibold">本次段落（默认全选，可临时取消）</p>
            {p.segments.map((s, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={segIncluded.has(i)}
                  onChange={() => setSegIncluded(prev => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  })}
                />
                <span>{s.title || "（无标题）"}（约{s.targetWords}字）</span>
              </label>
            ))}
          </div>
        );
      })()}

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map(t => <button key={t} onClick={() => setText(text + t)} className="btn-soft text-xs">{t}</button>)}
          {isDesktop() && supported && (
            <button onClick={recording ? stop : start} className={`text-xs px-2 py-1 rounded ${recording ? "bg-red-500 text-white" : "bg-primary-surface"}`}>
              {recording ? "停止录音" : "开始录音"}
            </button>
          )}
        </div>
        {recording && interim && <p className="text-xs text-text-muted">实时：{interim}</p>}
        <textarea className="input h-40" placeholder="录音转写或手动输入本节课内容…" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={doCorrect} disabled={correcting || !text} className="btn-soft">
          {correcting ? "纠错中…" : "AI 纠错"}
        </button>
      </div>

      <button onClick={doGenerate} disabled={generating || !text || !studentId || !profileId} className="btn-primary">
        {generating ? "正在生成…" : "生成反馈"}
      </button>

      {preview && (
        <div className="card-accent space-y-2">
          <h2 className="section-title">预览（可编辑）</h2>
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
