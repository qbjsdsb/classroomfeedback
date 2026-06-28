import { SpecProfile, SpecSegment, Student, Feedback } from "../types";

const JSON_INSTRUCTION = "请严格只输出 JSON，不要输出任何解释文字或 markdown 代码块。";

export function correctPrompt(rawText: string, studentNames: string[], subjectTerms: string[]) {
  return [
    { role: "system", content: `你是中文语音识别纠错助手。纠正 ASR 常见错别字，尤其人名与学科术语。已知学生姓名：${studentNames.join("、") || "（无）"}。已知学科术语：${subjectTerms.join("、") || "（无）"}。只返回纠错后的纯文本，不要解释。` },
    { role: "user", content: rawText },
  ];
}

export function generatePrompt(
  profile: SpecProfile,
  student: Student,
  courseContent: string,
  history: Feedback[],
  includedSegments: SpecSegment[],
) {
  const segDesc = includedSegments.map((s, i) =>
    `第${i + 1}段「${s.title}」约${s.targetWords}字，要点：${s.contentPoints}${s.freeNote ? "；补充：" + s.freeNote : ""}`
  ).join("\n");

  // 输出格式规则：基于每段 format 生成具体指令
  const formatRules = includedSegments.map((s, i) => {
    if (s.format === "title") {
      return `第${i + 1}段以"【${s.title}】"开头，后接正文`;
    } else if (s.format === "number") {
      return `第${i + 1}段以"${i + 1}. "开头，后接正文`;
    } else {
      return `第${i + 1}段直接写正文，无标题无序号`;
    }
  }).join("\n");

  // few-shot：取 history 中 includeInLearning=true 的，最多 5 条
  const fewShot = history.filter(h => h.includeInLearning && h.finalText).slice(-5);
  const fewShotTxt = fewShot.length > 0
    ? fewShot.map((h, i) => `### 示例 ${i + 1}\n课程内容：${h.courseContent || "（未记录）"}\n反馈：${h.finalText}`).join("\n\n")
    : "";

  // 风格特征强约束
  const sf = profile.styleFeatures;
  const warmthDesc = ["", "冷静客观", "平和", "适中", "温暖", "非常温暖亲切"][sf.warmth] || "适中";
  const formalityDesc = ["", "口语化", "半口语", "适中", "正式", "非常正式书面"][sf.formality] || "适中";
  const concisenessDesc = ["", "极简", "简洁", "适中", "详细", "非常详细展开"][sf.conciseness] || "适中";
  const encouragementDesc = ["", "少鼓励", "偶尔鼓励", "适中", "多鼓励", "充满鼓励肯定"][sf.encouragement] || "适中";
  const sfTxt = `## 风格特征（必须严格遵守）
- 温暖度：${sf.warmth}/5（${warmthDesc}）
- 正式度：${sf.formality}/5（${formalityDesc}）
- 简洁度：${sf.conciseness}/5（${concisenessDesc}）
- 鼓励倾向：${sf.encouragement}/5（${encouragementDesc}）
${sf.addressStyle ? `- 称呼方式：${sf.addressStyle}\n` : ""}${sf.punctuation ? `- 标点偏好：${sf.punctuation}\n` : ""}${sf.sentencePattern ? `- 句式偏好：${sf.sentencePattern}` : ""}`;

  const system = `你是教培课后反馈撰写助手。严格按以下规范档撰写反馈。
语气：${profile.tone}；风格说明：${profile.styleNote}

## 段落结构与要点（只能写这些内容）
${segDesc}

## 输出格式规则（必须严格遵守）
${formatRules}
- 段落之间用一个空行分隔
- 开头"${profile.opening}"融入第1段开头，不独立成段
- 结尾"${profile.ending}"融入最后一段结尾，不独立成段
- 整篇反馈只含上述${includedSegments.length}个段落，不得增减段落

## 内容边界（必须严格遵守）
- 只能输出上述段落要点描述的内容，不得新增 segments 之外的段落、句子、寒暄、客套话、署名
- styleFeatures 的温暖度/鼓励倾向只能通过用词和语气体现，不得新增独立句子或段落
- 不得添加"希望家长配合""如有疑问联系老师"等 segments 未列出的客套话（除非 ending 字段明确要求）
- 每段内容紧扣该段 contentPoints，不跨段混写

${sfTxt}
${fewShotTxt ? `\n## 参考示例（仅参考语气/用词/句式/长度，不参考其段落结构）\n注意：示例的格式/分段方式/标题样式不得模仿，段落结构严格以上述规范档 segments 为准。\n${fewShotTxt}` : ""}
${JSON_INSTRUCTION}
输出 JSON 格式：{"feedback":"整篇反馈正文"}`;
  const user = `学生姓名：${student.name}；年级：${student.grade}；性格：${student.personality}；薄弱点：${student.weaknesses}；家长关注：${student.parentFocus}
科目：${profile.subject}
本节课内容（老师口述/输入）：${courseContent}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

export function learnPrompt(samples: string[]) {
  const txt = samples.map((s, i) => `--- 样本${i + 1} ---\n${s}`).join("\n\n");
  const system = `你是反馈格式分析助手。分析以下历史反馈样本，归纳出统一的格式规范和风格特征。
${JSON_INSTRUCTION}
输出 JSON 格式：
{"tone":"正式书面|半书面|口语","styleNote":"风格说明","segments":[{"title":"段落标题","targetWords":数字,"contentPoints":"要点","freeNote":"补充","format":"title|number|none"}],"exemplarSamples":["代表性样本1原文","代表性样本2原文"],"opening":"常用开头","ending":"常用结尾","styleFeatures":{"warmth":1-5,"formality":1-5,"conciseness":1-5,"encouragement":1-5,"addressStyle":"称呼方式","punctuation":"标点偏好","sentencePattern":"句式偏好"}}

段落 format 字段说明（重要）：
- "title"：段落以【标题】开头，后接正文（如"【课堂内容】本节课学习了..."）
- "number"：段落以序号开头，后接正文（如"1. 本节课学习了..."）
- "none"：段落直接写正文，无标题无序号（如"本节课学习了..."）

format 判断规则：分析样本中段落起始方式。若段落以【】或书名号包裹的标题开头，format="title"；若以"1." "2."等序号开头，format="number"；若直接是正文无标题，format="none"。所有段落 format 必须一致。

风格特征评分标准：
- warmth（温暖度）：1=冷静客观，3=适中，5=非常温暖亲切
- formality（正式度）：1=口语化，3=适中，5=非常正式书面
- conciseness（简洁度）：1=极简，3=适中，5=非常详细展开
- encouragement（鼓励倾向）：1=少鼓励，3=适中，5=充满鼓励肯定
- addressStyle：如 "XX妈妈您好"
- punctuation：如 "规范标点，多用句号" 或 "口语化，多用感叹号"
- sentencePattern：如 "长短句结合" 或 "多用短句"

exemplarSamples：从上传的样本中选 1-2 条最能体现该老师反馈风格的真实原文（逐字摘录，不修改），作为生成时的金标准。选最完整、最典型的，不要选异常短的。

styleFeatures 必须填写完整，数值字段必须是 1-5 的整数。segments 每个必须含 format 字段。exemplarSamples 必须含 1-2 条真实样本原文。`;
  return [{ role: "system", content: system }, { role: "user", content: txt }];
}

export function splitPrompt(studentNames: string[], rawText: string) {
  const names = studentNames.join("、");
  const system = `你是课程内容拆分助手。老师会口述一整节课涉及多个学生的情况。请按学生姓名把内容拆分到对应学生。
学生名单：${names}
${JSON_INSTRUCTION}
输出 JSON 格式：{"学生名1":"该学生相关内容","学生名2":"..."}。名单中未提及的学生对应空字符串。不要编造名单外的人名。`;
  return [{ role: "system", content: system }, { role: "user", content: rawText }];
}

export function analyzeEditsPrompt(profile: SpecProfile, diffs: { aiOriginal: string; finalText: string }[]) {
  const diffTxt = diffs.map((d, i) => `--- 修改记录${i + 1} ---
AI原文：${d.aiOriginal}
老师修改后：${d.finalText}`).join("\n\n");
  const profileDesc = `当前规范档：语气=${profile.tone}；风格=${profile.styleNote}；开头=${profile.opening}；结尾=${profile.ending}；段落数=${profile.segments.length}`;
  const system = `你是反馈修改习惯分析助手。分析老师对 AI 生成反馈的修改，找出老师的写作偏好，提出规范档优化建议。
${profileDesc}
只针对老师反复出现的修改模式提建议（evidenceCount>=3 才算反复）。
${JSON_INSTRUCTION}
输出 JSON：{"suggestions":[{"field":"字段路径如opening/styleNote/segments[0].contentPoints","current":"当前值","proposal":"建议值","observed":"观察到的修改模式","evidenceCount":数字}]}。无建议时返回 {"suggestions":[]}。`;
  return [{ role: "system", content: system }, { role: "user", content: diffTxt }];
}

export function extractProfilePrompt(studentName: string, feedbackTexts: string[]) {
  const txt = feedbackTexts.map((f, i) => `--- 反馈${i + 1} ---\n${f}`).join("\n\n");
  const system = `你是学生画像分析助手。根据以下该学生的历史反馈，提炼该学生的性格特点、薄弱点、家长关注点。只根据反馈内容提炼，不编造。某方面无依据则对应字段返回空字符串。
学生姓名：${studentName}
${JSON_INSTRUCTION}
输出 JSON：{"personalityProposal":"性格特点提炼","weaknessesProposal":"薄弱点提炼","parentFocusProposal":"家长关注点提炼"}`;
  return [{ role: "system", content: system }, { role: "user", content: txt }];
}
