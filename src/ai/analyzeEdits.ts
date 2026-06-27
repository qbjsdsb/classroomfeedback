// src/ai/analyzeEdits.ts
import { callDeepSeek } from "./client";
import { analyzeEditsPrompt } from "./prompts";
import { SpecProfile } from "../types";

function parseJsonLoose(raw: string): any {
  let s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{"); const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export interface EditSuggestion {
  field: string;
  current: string;
  proposal: string;
  observed: string;
  evidenceCount: number;
}

export async function analyzeEdits(args: {
  apiKey: string;
  profile: SpecProfile;
  diffs: { aiOriginal: string; finalText: string }[];
}): Promise<EditSuggestion[]> {
  const messages = analyzeEditsPrompt(args.profile, args.diffs);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "analyzeEdits");
  const parsed = parseJsonLoose(res.content);
  const arr = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  return arr.map((s: any) => ({
    field: String(s.field ?? ""),
    current: String(s.current ?? ""),
    proposal: String(s.proposal ?? ""),
    observed: String(s.observed ?? ""),
    evidenceCount: Number(s.evidenceCount ?? 0) || 0,
  }));
}
