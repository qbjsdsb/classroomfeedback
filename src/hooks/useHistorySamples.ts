import { db } from "../db/schema";
import { SourceType } from "../types";

export async function listSamples(profileId: number) {
  return db.historySamples.where("specProfileId").equals(profileId).toArray();
}
export async function addSample(profileId: number, rawText: string, sourceType: SourceType) {
  await db.historySamples.add({ specProfileId: profileId, rawText, sourceType, createdAt: Date.now() });
}
