import { db } from "../db/schema";
import { Suggestion } from "../types";
import { analyzeEdits, EditSuggestion } from "../ai/analyzeEdits";
import { SpecProfile } from "../types";
import { getApiKey } from "./useSettings";
import { listDiffsByProfile } from "./useFeedbacks";

export async function countDiffs(specProfileId: number): Promise<number> {
  return (await listDiffsByProfile(specProfileId)).length;
}

export async function runAnalyze(profile: SpecProfile): Promise<EditSuggestion[]> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("请先在设置中填入 API Key");
  const diffs = await listDiffsByProfile(profile.id!);
  if (diffs.length < 20) throw new Error(`仅积累 ${diffs.length} 条修改记录，至少需 20 条才能分析`);
  const suggestions = await analyzeEdits({ apiKey, profile, diffs });
  for (const s of suggestions) {
    await db.suggestions.add({
      specProfileId: profile.id!, type: "style", field: s.field,
      current: s.current, proposal: s.proposal, observed: s.observed,
      evidenceCount: s.evidenceCount, status: "pending", createdAt: Date.now(),
    });
  }
  return suggestions;
}

export async function applySuggestion(suggestionId: number): Promise<void> {
  const s = await db.suggestions.get(suggestionId); if (!s) return;
  const p = await db.specProfiles.get(s.specProfileId); if (!p) return;
  const locked = new Set(p.lockedFields);
  if (locked.has(s.field)) throw new Error("该字段已锁定，无法应用建议");
  const patch: any = {};
  if (s.field === "tone" || s.field === "styleNote" || s.field === "opening" || s.field === "ending") {
    patch[s.field] = s.proposal;
  } else if (s.field.startsWith("segments[")) {
    const m = s.field.match(/^segments\[(\d+)\]\.(\w+)$/);
    if (m) {
      const idx = Number(m[1]); const key = m[2] as "title" | "targetWords" | "contentPoints" | "freeNote";
      const segs = [...p.segments];
      if (segs[idx]) {
        segs[idx] = { ...segs[idx], [key]: key === "targetWords" ? Number(s.proposal) || 0 : s.proposal };
        patch.segments = segs;
      }
    }
  }
  if (Object.keys(patch).length > 0) await db.specProfiles.update(s.specProfileId, patch);
  await db.suggestions.update(suggestionId, { status: "accepted" });
}

export async function rejectSuggestion(suggestionId: number): Promise<void> {
  await db.suggestions.update(suggestionId, { status: "rejected" });
}

export async function applyAndLock(suggestionId: number): Promise<void> {
  const s = await db.suggestions.get(suggestionId); if (!s) return;
  await applySuggestion(suggestionId);
  const p = await db.specProfiles.get(s.specProfileId); if (!p) return;
  const locked = new Set(p.lockedFields);
  locked.add(s.field);
  await db.specProfiles.update(s.specProfileId, { lockedFields: [...locked] });
}
