// src/ai/parse.ts
// 宽松解析 DeepSeek 返回的 JSON：容忍 ```json 代码块包裹、首尾多余文字
// 5 个 AI 模块（generate/split/learn/analyzeEdits/extractProfile）共用

export function parseJsonLoose(raw: string): any {
  let s = raw.trim();
  // 去除 ```json 或 ``` 包裹
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  // 截取首个 { 到最后一个 }，忽略前后噪声文字
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}
