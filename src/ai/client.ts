// src/ai/client.ts
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

// 用 Error 子类区分"已处理的 HTTP 错误"和"fetch 网络错误"
// 网络错误可重试，HTTP 4xx/5xx 错误的 retryable 由 status 决定
class HttpError extends Error {
  constructor(message: string, public readonly status: number, public readonly retryable: boolean) {
    super(message);
    this.name = "HttpError";
  }
}

// 4xx 不重试：客户端错误重试只会重复烧 token，不会变好
// 5xx 重试：服务端临时故障
function classifyStatus(status: number): boolean {
  return status >= 500;
}

// 把 HTTP 状态映射成对用户友好的中文错误信息
function friendlyMessage(status: number): string {
  switch (status) {
    case 401: return "API Key 无效或已过期，请在设置页检查";
    case 403: return "无访问权限（403），请确认 API Key 权限";
    case 400: return "请求格式错误（400）";
    case 429: return "请求过于频繁，请稍后再试（429 限流）";
    default: return `服务异常（HTTP ${status}）`;
  }
}

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
      if (!r.ok) {
        // 解析 DeepSeek 错误响应里的 message（如果有）
        let apiMessage: string | undefined;
        try { const err = await r.json(); apiMessage = err?.error?.message; } catch { /* 忽略解析失败 */ }
        const base = friendlyMessage(r.status);
        const msg = apiMessage ? `${base}：${apiMessage}` : base;
        const retryable = classifyStatus(r.status);
        const httpErr = new HttpError(msg, r.status, retryable);
        // 4xx 立即抛出（被外层 catch 捕获后因 retryable=false 直接 rethrow）
        // 5xx 也抛出，外层 catch 据 retryable 决定是否重试
        throw httpErr;
      }
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      await db.tokenUsage.add({ callType, promptTokens, completionTokens, timestamp: Date.now() });
      return { content, promptTokens, completionTokens };
    } catch (e: any) {
      // HttpError：4xx 立即失败，5xx 进入重试
      if (e instanceof HttpError) {
        if (!e.retryable) throw e;
        lastErr = e;
        continue;
      }
      // 非 HttpError = fetch 网络错误（断网、DNS 失败等），可重试
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("DeepSeek 调用失败");
}
