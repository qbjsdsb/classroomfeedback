import { db } from "../db/schema";
import { CallType } from "../types";

export interface ChatRequest {
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  responseFormatJson?: boolean;
}

export interface ChatResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

const MAX_RETRIES = 2;

export async function callDeepSeek(req: ChatRequest, callType: CallType): Promise<ChatResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body: Record<string, unknown> = { model: req.model, messages: req.messages };
      if (req.responseFormatJson) body.response_format = { type: "json_object" };
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${req.apiKey}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      await db.tokenUsage.add({ callType, promptTokens, completionTokens, timestamp: Date.now() });
      return { content, promptTokens, completionTokens };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("DeepSeek 调用失败");
}
