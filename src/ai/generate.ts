// src/ai/generate.ts
import { callDeepSeek } from "./client";
import { generatePrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { SpecProfile, SpecSegment, Student, Feedback } from "../types";

export async function generateFeedback(args: {
  apiKey: string; profile: SpecProfile; student: Student; courseContent: string; history: Feedback[];
  includedSegments: SpecSegment[];
}): Promise<{ feedback: string }> {
  const messages = generatePrompt(args.profile, args.student, args.courseContent, args.history, args.includedSegments);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "generate");
  const parsed = parseJsonLoose(res.content);
  return { feedback: String(parsed.feedback ?? "") };
}
