// src/ai/split.ts
import { callDeepSeek } from "./client";
import { splitPrompt } from "./prompts";

function parseJsonLoose(raw: string): any {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

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
