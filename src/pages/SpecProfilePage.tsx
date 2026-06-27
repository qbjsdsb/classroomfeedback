import { useEffect, useState } from "react";
import { SpecProfile } from "../types";
import { listProfiles, updateProfile, toggleLock, relearn, createProfile } from "../hooks/useSpecProfiles";
import { listSamples, addSample } from "../hooks/useHistorySamples";
import { countDiffs, runAnalyze, applySuggestion, rejectSuggestion, applyAndLock } from "../hooks/useSuggestions";
import { EditSuggestion } from "../ai/analyzeEdits";
import { db } from "../db/schema";

export default function SpecProfilePage() {
  const [profiles, setProfiles] = useState<SpecProfile[]>([]);
  const [curId, setCurId] = useState<number | null>(null);
  const [samples, setSamples] = useState<{ rawText: string }[]>([]);
  const [newSample, setNewSample] = useState("");
  const [status, setStatus] = useState("");
  const [diffCount, setDiffCount] = useState(0);
  const [suggestions, setSuggestions] = useState<(EditSuggestion & { id?: number })[]>([]);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const cur = profiles.find(p => p.id === curId) ?? null;

  const reload = async () => { setProfiles(await listProfiles()); };
  useEffect(() => { reload(); }, []);
  useEffect(() => { (async () => { if (curId) setSamples(await listSamples(curId)); })(); }, [curId]);
  useEffect(() => {
    (async () => {
      if (cur?.id) {
        setDiffCount(await countDiffs(cur.id));
        setSuggestions([]);
      }
    })();
  }, [curId, profiles]);

  // 乐观更新：先同步更新本地 profiles，再异步写库，避免每次按键刷新导致失焦
  const patchLocal = (id: number, patch: Partial<SpecProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };
  const patch = (id: number, patch: Partial<SpecProfile>) => {
    patchLocal(id, patch);
    updateProfile(id, patch);
  };

  const reanalyze = async () => {
    if (!cur?.id) return;
    try { setStatus("分析中…"); await relearn(cur.id); await reload(); setStatus("已更新"); }
    catch (e: any) { setStatus("失败：" + e.message); }
    setTimeout(() => setStatus(""), 2500);
  };
  const doAnalyze = async () => {
    if (!cur) return;
    try {
      setAnalyzeStatus("分析中…"); setSuggestions([]);
      const list = await runAnalyze(cur);
      const pending = await db.suggestions.where("specProfileId").equals(cur.id!).toArray();
      const map = new Map(pending.map(p => [p.field + "|" + p.proposal, p.id]));
      setSuggestions(list.map(s => ({ ...s, id: map.get(s.field + "|" + s.proposal) })));
      setAnalyzeStatus(list.length === 0 ? "未发现明显修改模式" : "");
    } catch (e: any) { setAnalyzeStatus("失败：" + e.message); }
    setTimeout(() => setAnalyzeStatus(""), 3000);
  };
  const upload = async () => {
    if (!cur?.id || !newSample.trim()) return;
    await addSample(cur.id, newSample, "paste"); setNewSample("");
    setSamples(await listSamples(cur.id));
    setStatus("您新上传了反馈，建议重新分析 [立即更新]");
    setTimeout(() => setStatus(""), 3000);
  };
  const doCreate = async () => {
    const id = await createProfile("通用", "我的规范档");
    await reload(); setCurId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">规范档</h1>
        <button onClick={doCreate} className="text-sm text-blue-600">+ 新建</button>
      </div>
      <select value={curId ?? ""} onChange={e => setCurId(Number(e.target.value))} className="border rounded p-2 w-full">
        <option value="">选择规范档…</option>
        {Object.entries(
          profiles.reduce((acc: Record<string, SpecProfile[]>, p) => {
            (acc[p.subject] = acc[p.subject] || []).push(p); return acc;
          }, {})
        ).map(([subj, list]) => (
          <optgroup key={subj} label={subj}>
            {list.map(p => <option key={p.id} value={p.id}>{p.name}{p.isBuiltin ? "（内置）" : ""}</option>)}
          </optgroup>
        ))}
      </select>

      {cur && (
        <div className="space-y-3 border rounded p-3">
          <label className="block"><span className="text-sm">名称</span>
            <input className="block w-full border rounded p-2" value={cur.name}
              onChange={e => { patch(cur.id!, { name: e.target.value }); }} />
          </label>
          <div className="block">
            <span className="text-sm">语气</span>
            <div className="flex gap-2 items-center">
              <select className="block w-full border rounded p-2" value={cur.tone}
                onChange={e => { patch(cur.id!, { tone: e.target.value as any }); }}>
                <option>正式书面</option><option>半书面</option><option>口语</option>
              </select>
              <button onClick={() => { patchLocal(cur.id!, { lockedFields: toggleLockedArray(cur.lockedFields, "tone") }); toggleLock(cur.id!, "tone"); }} className="text-xs whitespace-nowrap">
                {cur.lockedFields.includes("tone") ? "🔒已锁" : "🔓锁定"}
              </button>
            </div>
          </div>
          <label className="block"><span className="text-sm">风格说明</span>
            <textarea className="block w-full border rounded p-2" value={cur.styleNote}
              onChange={e => { patch(cur.id!, { styleNote: e.target.value }); }} />
          </label>
          <div>
            <span className="text-sm">段落（可编辑）</span>
            {cur.segments.map((s, i) => (
              <div key={i} className="border rounded p-2 mt-1 space-y-1">
                <input className="block w-full border rounded p-1" placeholder="标题" value={s.title}
                  onChange={e => { const segs = [...cur.segments]; segs[i] = { ...s, title: e.target.value }; patch(cur.id!, { segments: segs }); }} />
                <input type="number" className="block w-full border rounded p-1" placeholder="目标字数" value={s.targetWords}
                  onChange={e => { const segs = [...cur.segments]; segs[i] = { ...s, targetWords: Number(e.target.value) }; patch(cur.id!, { segments: segs }); }} />
                <input className="block w-full border rounded p-1" placeholder="内容要点" value={s.contentPoints}
                  onChange={e => { const segs = [...cur.segments]; segs[i] = { ...s, contentPoints: e.target.value }; patch(cur.id!, { segments: segs }); }} />
                <input className="block w-full border rounded p-1" placeholder="段落自由说明" value={s.freeNote}
                  onChange={e => { const segs = [...cur.segments]; segs[i] = { ...s, freeNote: e.target.value }; patch(cur.id!, { segments: segs }); }} />
              </div>
            ))}
          </div>
          <label className="block"><span className="text-sm">开头</span>
            <input className="block w-full border rounded p-2" value={cur.opening}
              onChange={e => { patch(cur.id!, { opening: e.target.value }); }} />
          </label>
          <label className="block"><span className="text-sm">结尾</span>
            <input className="block w-full border rounded p-2" value={cur.ending}
              onChange={e => { patch(cur.id!, { ending: e.target.value }); }} />
          </label>
        </div>
      )}

      {cur && !cur.isBuiltin && (
        <div className="space-y-2 border rounded p-3">
          <h2 className="font-semibold">历史反馈样本（{samples.length}）</h2>
          <textarea className="block w-full border rounded p-2" placeholder="粘贴一条历史反馈…" value={newSample} onChange={e => setNewSample(e.target.value)} />
          <button onClick={upload} className="bg-gray-200 px-3 py-1 rounded">添加样本</button>
          <button onClick={reanalyze} className="bg-blue-600 text-white px-3 py-1 rounded ml-2">重新分析（限最近50条）</button>
          {status && <p className="text-sm text-blue-600">{status}</p>}
        </div>
      )}

      {cur && !cur.isBuiltin && (
        <div className="space-y-2 border rounded p-3">
          <h2 className="font-semibold">修改差异学习</h2>
          <p className="text-sm text-gray-600">已积累 {diffCount} 条修改记录{diffCount < 20 ? "（至少需 20 条）" : ""}</p>
          <button onClick={doAnalyze} disabled={diffCount < 20} className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
            分析我的修改习惯
          </button>
          {analyzeStatus && <p className="text-sm text-purple-600">{analyzeStatus}</p>}
          {suggestions.map((s, i) => (
            <div key={i} className="border rounded p-2 space-y-1 bg-purple-50">
              <p className="text-xs text-gray-500">字段：{s.field}（证据 {s.evidenceCount} 条）</p>
              <p className="text-xs">当前：{s.current || "（空）"}</p>
              <p className="text-xs">建议：{s.proposal}</p>
              <p className="text-xs text-gray-600">观察：{s.observed}</p>
              <div className="flex gap-2 text-xs">
                {s.id && <button onClick={async () => { await applySuggestion(s.id!); await reload(); setSuggestions(suggestions.filter((x, j) => j !== i)); }} className="text-green-600">采纳</button>}
                {s.id && <button onClick={async () => { await applyAndLock(s.id!); await reload(); setSuggestions(suggestions.filter((x, j) => j !== i)); }} className="text-blue-600">采纳并锁定</button>}
                {s.id && <button onClick={async () => { await rejectSuggestion(s.id!); setSuggestions(suggestions.filter((x, j) => j !== i)); }} className="text-gray-600">拒绝</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function toggleLockedArray(locked: string[], field: string): string[] {
  const s = new Set(locked);
  if (s.has(field)) s.delete(field); else s.add(field);
  return [...s];
}
