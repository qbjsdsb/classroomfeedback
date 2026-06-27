// src/ai/extractProfile.ts
import { callDeepSeek } from "./client";
import { extractProfilePrompt } from "./prompts";
import { parseJsonLoose } from "./parse";

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
