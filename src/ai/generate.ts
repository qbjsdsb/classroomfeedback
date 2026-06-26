// src/ai/generate.ts
import { callDeepSeek } from "./client";
import { generatePrompt } from "./prompts";
import { SpecProfile, Student, Feedback } from "../types";

function parseJsonLoose(raw: string): any {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export async function generateFeedback(args: {
  apiKey: string; profile: SpecProfile; student: Student; courseContent: string; history: Feedback[];
}): Promise<{ feedback: string }> {
  const messages = generatePrompt(args.profile, args.student, args.courseContent, args.history);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "generate");
  const parsed = parseJsonLoose(res.content);
  return { feedback: String(parsed.feedback ?? "") };
}
