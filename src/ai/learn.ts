// src/ai/learn.ts
import { callDeepSeek } from "./client";
import { learnPrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { Tone, SpecSegment, StyleFeatures, SegmentFormat } from "../types";

const DEFAULT_SF: StyleFeatures = {
  warmth: 3, formality: 3, conciseness: 3, encouragement: 3,
  addressStyle: "", punctuation: "", sentencePattern: "",
};

function clampInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (isNaN(n)) return fallback;
  return Math.max(1, Math.min(5, Math.round(n)));
}

const VALID_FORMATS: SegmentFormat[] = ["title", "number", "none"];

function parseFormat(v: unknown): SegmentFormat {
  if (typeof v === "string" && VALID_FORMATS.includes(v as SegmentFormat)) {
    return v as SegmentFormat;
  }
  return "none";
}

function parseStyleFeatures(sf: any): StyleFeatures {
  if (!sf || typeof sf !== "object") return { ...DEFAULT_SF };
  return {
    warmth: clampInt(sf.warmth, 3),
    formality: clampInt(sf.formality, 3),
    conciseness: clampInt(sf.conciseness, 3),
    encouragement: clampInt(sf.encouragement, 3),
    addressStyle: typeof sf.addressStyle === "string" ? sf.addressStyle : "",
    punctuation: typeof sf.punctuation === "string" ? sf.punctuation : "",
    sentencePattern: typeof sf.sentencePattern === "string" ? sf.sentencePattern : "",
  };
}

export async function learnSpec(args: { apiKey: string; samples: string[] }): Promise<{
  tone: Tone; styleNote: string; segments: SpecSegment[]; opening: string; ending: string;
  styleFeatures: StyleFeatures;
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
      format: parseFormat(s.format),
    })) : [],
    opening: String(p.opening ?? ""), ending: String(p.ending ?? ""),
    styleFeatures: parseStyleFeatures(p.styleFeatures),
  };
}
