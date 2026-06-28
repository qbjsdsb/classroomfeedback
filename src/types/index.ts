// src/types/index.ts

export type Tone = "正式书面" | "半书面" | "口语";

export type SegmentFormat = "title" | "number" | "none";

export interface SpecSegment {
  title: string;
  targetWords: number;
  contentPoints: string;
  freeNote: string;
  format: SegmentFormat;
}

export interface StyleFeatures {
  warmth: number;          // 1-5 温暖度
  formality: number;       // 1-5 正式度
  conciseness: number;     // 1-5 简洁度
  encouragement: number;   // 1-5 鼓励倾向
  addressStyle: string;    // 称呼方式
  punctuation: string;     // 标点偏好
  sentencePattern: string; // 句式偏好
}

export interface SpecProfile {
  id?: number;
  subject: string;
  name: string;
  tone: Tone;
  styleNote: string;
  segments: SpecSegment[];
  opening: string;
  ending: string;
  styleFeatures: StyleFeatures;
  exemplarSamples: string[];  // learn 时选的 1-2 条代表性样本，生成时作为金标准
  lockedFields: string[];
  isBuiltin: boolean;
  createdAt: number;
}

export interface Student {
  id?: number;
  name: string;
  grade: string;
  personality: string;
  weaknesses: string;
  parentFocus: string;
  defaultSubject: string;
  createdAt: number;
}

export type SourceType = "word" | "txt" | "excel" | "paste";

export interface HistorySample {
  id?: number;
  specProfileId: number;
  rawText: string;
  sourceType: SourceType;
  createdAt: number;
}

export interface Feedback {
  id?: number;
  studentId: number;
  subject: string;
  specProfileId: number;
  courseContent: string;
  aiOriginal: string;
  finalText: string;
  includeInLearning: boolean;
  createdAt: number;
}

export type CallType = "correct" | "generate" | "learn" | "split" | "analyzeEdits" | "extractProfile";

export interface TokenUsage {
  id?: number;
  callType: CallType;
  promptTokens: number;
  completionTokens: number;
  timestamp: number;
}

export interface Settings {
  id?: number;
  apiKey: string;
  lastBackupAt: number;
}

export interface Suggestion {
  id?: number;
  specProfileId: number;
  type: "style";
  field: string;
  current: string;
  proposal: string;
  observed: string;
  evidenceCount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}
