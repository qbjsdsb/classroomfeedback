// src/types/index.ts

export type Tone = "正式书面" | "半书面" | "口语";

export interface SpecSegment {
  title: string;
  targetWords: number;
  contentPoints: string;
  freeNote: string;
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

export type CallType = "correct" | "generate" | "learn";

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
