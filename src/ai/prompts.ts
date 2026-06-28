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
  // 内容覆盖清单：segments 降级为"确保提到这些点"
  const contentChecklist = includedSegments.map((s, i) =>
    `第${i + 1}段「${s.title}」：确保提到以下要点——${s.contentPoints}${s.freeNote ? "（补充：" + s.freeNote + "）" : ""}`
  ).join("\n");

  // 输出格式规则：基于每段 format（保留，客观格式）
  const formatRules = includedSegments.map((s, i) => {
    if (s.format === "title") {
      return `第${i + 1}段以"【${s.title}】"开头，后接正文`;
    } else if (s.format === "number") {
      return `第${i + 1}段以"${i + 1}. "开头，后接正文`;
    } else {
      return `第${i + 1}段直接写正文，无标题无序号`;
    }
  }).join("\n");

  // 金标准样本（learn 时选的代表性原文）
  const exemplarTxt = profile.exemplarSamples && profile.exemplarSamples.length > 0
    ? profile.exemplarSamples.map((s, i) => `### 金标准 ${i + 1}（该老师最典型的反馈，必须最严格模仿其语气/句式/节奏/用词）\n${s}`).join("\n\n")
    : "";

  // few-shot：历史反馈作为模仿模板（最多 3 条）
  const fewShot = history.filter(h => h.includeInLearning && h.finalText).slice(-3);
  const fewShotTxt = fewShot.length > 0
    ? fewShot.map((h, i) => `### 模仿范本 ${i + 1}（逐字模仿其句式/连接词/段落长度/标点/语气节奏，只换课程内容）\n课程内容：${h.courseContent || "（未记录）"}\n反馈：${h.finalText}`).join("\n\n")
    : "";

  const system = `你是教培课后反馈撰写助手。你的任务是：用与老师历史反馈**完全相同的语气、句式、连接词、段落长度、标点习惯、节奏**撰写今天的反馈，只把课程内容换成今天的。像是同一个人写的。

${exemplarTxt ? `## 金标准（最严格模仿）\n${exemplarTxt}\n\n` : ""}${fewShotTxt ? `## 模仿范本（逐字模仿其风格）\n${fewShotTxt}\n\n` : ""}## 内容覆盖清单（确保提到这些点，怎么写看上面范本）
${contentChecklist}

## 输出格式规则（客观格式，必须遵守）
${formatRules}
- 段落之间用一个空行分隔
- 整篇反馈只含上述${includedSegments.length}个段落，不得增减段落
${profile.opening ? `- 开头参考范本的方式融入第1段（如范本用"${profile.opening}"开头，今天也用类似方式）` : ""}${profile.ending ? `- 结尾参考范本的方式融入最后一段` : ""}

## 内容边界（必须严格遵守）
- 只能输出上述段落，不得新增 segments 之外的段落、句子、寒暄、客套话、署名
- 不得添加"希望家长配合""如有疑问联系老师"等范本未出现的客套话
- 每段内容紧扣该段要点，不跨段混写
- 语气/用词/句式严格模仿上面的金标准和范本，不要用 AI 自己的腔调

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
