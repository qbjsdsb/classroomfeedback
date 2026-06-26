// src/ai/learn.ts
import { callDeepSeek } from "./client";
import { learnPrompt } from "./prompts";
import { Tone, SpecSegment } from "../types";

function parseJsonLoose(raw: string): any {
  let s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{"); const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export async function learnSpec(args: { apiKey: string; samples: string[] }): Promise<{
  tone: Tone; styleNote: string; segments: SpecSegment[]; opening: string; ending: string;
}> {
  const messages = learnPrompt(args.samples);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "learn");
  const p = parseJsonLoose(res.content);
  return {
    tone: (p.tone as Tone) ?? "半书面",
    styleNote: String(p.styleNote ?? ""),
    segments: Array.isArray(p.segments) ? p.segments.map((s: any) => ({
      title: String(s.title ?? ""), targetWords: Number(s.targetWords ?? 0) || 0,
      contentPoints: String(s.contentPoints ?? ""), freeNote: String(s.freeNote ?? ""),
    })) : [],
    opening: String(p.opening ?? ""), ending: String(p.ending ?? ""),
  };
}
