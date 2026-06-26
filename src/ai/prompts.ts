import { SpecProfile, Student, Feedback } from "../types";

const JSON_INSTRUCTION = "请严格只输出 JSON，不要输出任何解释文字或 markdown 代码块。";

export function correctPrompt(rawText: string, studentNames: string[], subjectTerms: string[]) {
  return [
    { role: "system", content: `你是中文语音识别纠错助手。纠正 ASR 常见错别字，尤其人名与学科术语。已知学生姓名：${studentNames.join("、") || "（无）"}。已知学科术语：${subjectTerms.join("、") || "（无）"}。只返回纠错后的纯文本，不要解释。` },
    { role: "user", content: rawText },
  ];
}

export function generatePrompt(profile: SpecProfile, student: Student, courseContent: string, history: Feedback[]) {
  const segDesc = profile.segments.map((s, i) => `第${i + 1}段「${s.title}」约${s.targetWords}字，要点：${s.contentPoints}${s.freeNote ? "；补充：" + s.freeNote : ""}`).join("\n");
  const histTxt = history.slice(-2).map((h, i) => `历史反馈${i + 1}：${h.finalText}`).join("\n\n") || "（无历史反馈）";
  const system = `你是教培课后反馈撰写助手。严格按以下规范档撰写反馈。
语气：${profile.tone}；风格说明：${profile.styleNote}
段落结构：
${segDesc}
开头：${profile.opening}
结尾：${profile.ending}
${JSON_INSTRUCTION}
输出 JSON 格式：{"feedback":"整篇反馈正文"}`;
  const user = `学生姓名：${student.name}；年级：${student.grade}；性格：${student.personality}；薄弱点：${student.weaknesses}；家长关注：${student.parentFocus}
科目：${profile.subject}
本节课内容（老师口述/输入）：${courseContent}
${histTxt}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

export function learnPrompt(samples: string[]) {
  const txt = samples.map((s, i) => `--- 样本${i + 1} ---\n${s}`).join("\n\n");
  const system = `你是反馈格式分析助手。分析以下历史反馈样本，归纳出统一的格式规范。
${JSON_INSTRUCTION}
输出 JSON 格式：
{"tone":"正式书面|半书面|口语","styleNote":"风格说明","segments":[{"title":"段落标题","targetWords":数字,"contentPoints":"要点","freeNote":"补充"}],"opening":"常用开头","ending":"常用结尾"}`;
  return [{ role: "system", content: system }, { role: "user", content: txt }];
}
