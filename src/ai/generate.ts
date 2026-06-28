// src/ai/generate.ts
import { callDeepSeek } from "./client";
import { generatePrompt } from "./prompts";
import { parseJsonLoose } from "./parse";
import { selectTopN } from "./similarity";
import { SpecProfile, SpecSegment, Student, Feedback } from "../types";

export async function generateFeedback(args: {
  apiKey: string; profile: SpecProfile; student: Student; courseContent: string; history: Feedback[];
  includedSegments: SpecSegment[];
}): Promise<{ feedback: string }> {
  // few-shot 检索：从 history 中选最相似的 top 5（学生偏好 +0.3，同科目偏好 +0.1）
  const candidates = args.history.map(h => ({
    id: h.id!,
    text: h.finalText,
    studentId: h.studentId,
    subject: args.profile.subject,
  }));
  const top = selectTopN(args.courseContent, candidates, {
    topN: 5,
    preferSameStudent: args.student.id,
    preferSameSubject: args.profile.subject,
  });
  const topIds = new Set(top.map(t => t.id));
  const fewShot = args.history.filter(h => h.id !== undefined && topIds.has(h.id));

  const messages = generatePrompt(args.profile, args.student, args.courseContent, fewShot, args.includedSegments);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "generate");
  const parsed = parseJsonLoose(res.content);
  return { feedback: String(parsed.feedback ?? "") };
}
