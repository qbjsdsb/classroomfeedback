// src/ai/learn.ts
import { callDeepSeek } from "./client";
import { learnPrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { Tone, SpecSegment } from "../types";

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
