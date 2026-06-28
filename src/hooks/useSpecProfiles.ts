import { db } from "../db/schema";
import { SpecProfile, SpecSegment, StyleFeatures } from "../types";
import { learnSpec } from "../ai/learn";
import { getApiKey } from "./useSettings";

const DEFAULT_SF: StyleFeatures = {
  warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
  addressStyle: "", punctuation: "", sentencePattern: "",
};

export async function listProfiles(): Promise<SpecProfile[]> {
  return db.specProfiles.toArray();
}
export async function listProfilesBySubject(subject: string): Promise<SpecProfile[]> {
  if (!subject) return listProfiles();
  const matched = await db.specProfiles.where("subject").equals(subject).toArray();
  // 过滤结果为空时回退到全部规范档，避免学生填了 defaultSubject 但无匹配规范档
  // 导致下拉框为空、用户无法生成反馈的死锁场景
  return matched.length > 0 ? matched : listProfiles();
}
export async function getProfile(id: number): Promise<SpecProfile | undefined> {
  return db.specProfiles.get(id);
}
export async function updateProfile(id: number, patch: Partial<SpecProfile>): Promise<void> {
  await db.specProfiles.update(id, patch);
}
export async function createProfile(subject: string, name: string): Promise<number> {
  return db.specProfiles.add({
    subject, name, tone: "半书面", styleNote: "",
    segments: [{ title: "课堂内容", targetWords: 80, contentPoints: "", freeNote: "", format: "none" }],
    opening: "", ending: "", styleFeatures: { ...DEFAULT_SF },
    lockedFields: [], isBuiltin: false, createdAt: Date.now(),
  });
}
export async function toggleLock(id: number, fieldPath: string): Promise<void> {
  const p = await db.specProfiles.get(id); if (!p) return;
  const locked = new Set(p.lockedFields);
  if (locked.has(fieldPath)) locked.delete(fieldPath); else locked.add(fieldPath);
  await db.specProfiles.update(id, { lockedFields: [...locked] });
}
export async function relearn(id: number): Promise<void> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("请先在设置中填入 API Key");
  const samples = await db.historySamples.where("specProfileId").equals(id).toArray();
  const recent = samples.slice(-50).map(s => s.rawText);
  if (recent.length === 0) throw new Error("请先上传历史反馈");
  const learned = await learnSpec({ apiKey, samples: recent });
  const p = await db.specProfiles.get(id); if (!p) return;
  const locked = new Set(p.lockedFields);
  const mergeSeg = (idx: number, src: SpecSegment): SpecSegment => {
    const existing = p.segments[idx] ?? { title: "", targetWords: 0, contentPoints: "", freeNote: "", format: "none" as const };
    return {
      title: locked.has(`segments[${idx}].title`) ? existing.title : src.title,
      targetWords: locked.has(`segments[${idx}].targetWords`) ? existing.targetWords : src.targetWords,
      contentPoints: locked.has(`segments[${idx}].contentPoints`) ? existing.contentPoints : src.contentPoints,
      freeNote: locked.has(`segments[${idx}].freeNote`) ? existing.freeNote : src.freeNote,
      format: locked.has(`segments[${idx}].format`) ? existing.format : ((src as any).format ?? existing.format ?? "none"),
    };
  };
  const segments = learned.segments.map((s, i) => mergeSeg(i, s));
  await db.specProfiles.update(id, {
    tone: locked.has("tone") ? p.tone : learned.tone,
    styleNote: locked.has("styleNote") ? p.styleNote : learned.styleNote,
    opening: locked.has("opening") ? p.opening : learned.opening,
    ending: locked.has("ending") ? p.ending : learned.ending,
    styleFeatures: locked.has("styleFeatures") ? p.styleFeatures : learned.styleFeatures,
    segments,
  });
}
