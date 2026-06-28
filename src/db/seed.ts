import { db } from "./schema";
import { SpecProfile } from "../types";

export const BUILTIN_PROFILES: SpecProfile[] = [
  {
    subject: "通用", name: "简短口语风", tone: "口语", styleNote: "亲切简短，三五句话",
    segments: [{ title: "课堂表现", targetWords: 60, contentPoints: "今天学了什么、表现如何", freeNote: "", format: "none" }],
    opening: "XX妈妈好，今天", ending: "回家建议……",
    styleFeatures: {
      warmth: 5, formality: 1, conciseness: 2, encouragement: 5,
      addressStyle: "XX妈妈", punctuation: "口语化，多用感叹号", sentencePattern: "多用短句",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
  {
    subject: "通用", name: "正式书面风", tone: "正式书面", styleNote: "正式，多用肯定句，结尾带鼓励",
    segments: [
      { title: "课堂内容", targetWords: 80, contentPoints: "本节课知识点", freeNote: "", format: "title" },
      { title: "学生表现", targetWords: 100, contentPoints: "专注度、掌握情况", freeNote: "", format: "title" },
      { title: "家庭建议", targetWords: 60, contentPoints: "课后练习建议", freeNote: "", format: "title" },
    ],
    opening: "该生今日", ending: "望家长配合",
    styleFeatures: {
      warmth: 3, formality: 5, conciseness: 3, encouragement: 4,
      addressStyle: "XX家长您好", punctuation: "规范标点，多用句号", sentencePattern: "长短句结合",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
  {
    subject: "通用", name: "详细分段风", tone: "半书面", styleNote: "详细，按知识点分段",
    segments: [
      { title: "学习内容", targetWords: 120, contentPoints: "知识点逐一列出", freeNote: "", format: "title" },
      { title: "掌握情况", targetWords: 100, contentPoints: "每个知识点掌握度", freeNote: "", format: "title" },
      { title: "存在问题", targetWords: 80, contentPoints: "薄弱点", freeNote: "", format: "title" },
      { title: "后续计划", targetWords: 80, contentPoints: "下节课安排", freeNote: "", format: "title" },
    ],
    opening: "今日课堂反馈：", ending: "感谢配合",
    styleFeatures: {
      warmth: 4, formality: 3, conciseness: 5, encouragement: 3,
      addressStyle: "XX妈妈您好", punctuation: "规范标点", sentencePattern: "长短句结合",
    },
    lockedFields: [], isBuiltin: true, createdAt: 0,
  },
];

export async function seedBuiltinProfiles(): Promise<void> {
  const existing = (await db.specProfiles.filter(p => p.isBuiltin).toArray()).length;
  if (existing > 0) return;
  for (const p of BUILTIN_PROFILES) {
    await db.specProfiles.add({ ...p, createdAt: Date.now() });
  }
}
