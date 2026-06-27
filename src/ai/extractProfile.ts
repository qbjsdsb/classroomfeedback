// src/ai/extractProfile.ts
import { callDeepSeek } from "./client";
import { extractProfilePrompt } from "./prompts";

function parseJsonLoose(raw: string): any {
  let s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{"); const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export interface ProfileProposal {
  personalityProposal: string;
  weaknessesProposal: string;
  parentFocusProposal: string;
  sourceFeedbackCount: number;
}

export async function extractProfile(args: {
  apiKey: string;
  studentName: string;
  feedbackTexts: string[];
}): Promise<ProfileProposal> {
  const messages = extractProfilePrompt(args.studentName, args.feedbackTexts);
  const res = await callDeepSeek({ apiKey: args.apiKey, model: "deepseek-chat", messages, responseFormatJson: true }, "extractProfile");
  const p = parseJsonLoose(res.content);
  return {
    personalityProposal: String(p.personalityProposal ?? ""),
    weaknessesProposal: String(p.weaknessesProposal ?? ""),
    parentFocusProposal: String(p.parentFocusProposal ?? ""),
    sourceFeedbackCount: args.feedbackTexts.length,
  };
}
