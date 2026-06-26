// src/db/schema.ts
import Dexie, { Table } from "dexie";
import { Student, SpecProfile, HistorySample, Feedback, TokenUsage, Settings } from "../types";

export class FeedbackDB extends Dexie {
  students!: Table<Student, number>;
  specProfiles!: Table<SpecProfile, number>;
  historySamples!: Table<HistorySample, number>;
  feedbacks!: Table<Feedback, number>;
  tokenUsage!: Table<TokenUsage, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super("kehoufankui");
    this.version(1).stores({
      students: "++id, name, createdAt",
      specProfiles: "++id, subject, isBuiltin",
      historySamples: "++id, specProfileId",
      feedbacks: "++id, studentId, specProfileId, createdAt",
      tokenUsage: "++id, callType, timestamp",
      settings: "++id",
    });
  }
}

export const db = new FeedbackDB();
