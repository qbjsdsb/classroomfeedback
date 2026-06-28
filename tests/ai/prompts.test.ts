import { describe, it, expect } from "vitest";
import { generatePrompt } from "../../src/ai/prompts";
import { SpecProfile, Student } from "../../src/types";

const profile: SpecProfile = {
  subject: "数学", name: "p", tone: "正式书面", styleNote: "s",
  segments: [
    { title: "课堂内容", targetWords: 80, contentPoints: "知识点", freeNote: "", format: "none" },
    { title: "学生表现", targetWords: 100, contentPoints: "专注度", freeNote: "", format: "none" },
    { title: "家庭建议", targetWords: 60, contentPoints: "练习", freeNote: "", format: "none" },
  ],
  opening: "该生今日", ending: "望配合",
  styleFeatures: { warmth: 3, formality: 3, conciseness: 3, encouragement: 3, addressStyle: "", punctuation: "", sentencePattern: "" },
  exemplarSamples: [],
  lockedFields: [], isBuiltin: false, createdAt: 0,
};
const student: Student = { name: "张三", grade: "初三", personality: "", weaknesses: "", parentFocus: "", defaultSubject: "", createdAt: 0 };

describe("generatePrompt", () => {
  it("includedSegments 只含部分段落时，system 只含这些段落标题", () => {
    const included = [profile.segments[0], profile.segments[2]];
    const msgs = generatePrompt(profile, student, "课程", [], included);
    const sys = msgs[0].content;
    expect(sys).toContain("课堂内容");
    expect(sys).not.toContain("学生表现");
    expect(sys).toContain("家庭建议");
  });

  it("includedSegments 为全部段落时，system 含全部标题", () => {
    const included = profile.segments;
    const msgs = generatePrompt(profile, student, "课程", [], included);
    const sys = msgs[0].content;
    expect(sys).toContain("课堂内容");
    expect(sys).toContain("学生表现");
    expect(sys).toContain("家庭建议");
  });
});
