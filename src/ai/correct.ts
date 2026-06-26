// src/ai/correct.ts
import { callDeepSeek } from "./client";
import { correctPrompt } from "./prompts";

export async function correctText(args: { apiKey: string; rawText: string; studentNames: string[]; subjectTerms: string[] }): Promise<string> {
  const messages = correctPrompt(args.rawText, args.studentNames, args.subjectTerms);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages }, "correct");
  return res.content.trim();
}
