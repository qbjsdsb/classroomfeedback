// src/ai/split.ts
import { callDeepSeek } from "./client";
import { splitPrompt } from "./prompts";
import { parseJsonLoose } from "./parse";

export async function splitCourseContent(args: {
  apiKey: string;
  studentNames: string[];
  rawText: string;
}): Promise<Record<string, string>> {
  const messages = splitPrompt(args.studentNames, args.rawText);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "split");
  const parsed = parseJsonLoose(res.content);
  const result: Record<string, string> = {};
  for (const name of args.studentNames) {
    result[name] = String(parsed[name] ?? "");
  }
  return result;
}
