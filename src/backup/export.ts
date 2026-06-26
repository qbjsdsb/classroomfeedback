import { db } from "../db/schema";
import { setLastBackupAt } from "../hooks/useSettings";

export async function exportAll(): Promise<string> {
  const data = {
    students: await db.students.toArray(),
    specProfiles: await db.specProfiles.toArray(),
    historySamples: await db.historySamples.toArray(),
    feedbacks: await db.feedbacks.toArray(),
    tokenUsage: await db.tokenUsage.toArray(),
    settings: await db.settings.toArray(),
    exportedAt: Date.now(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction("rw", [db.students, db.specProfiles, db.historySamples, db.feedbacks, db.tokenUsage, db.settings], async () => {
    await db.students.bulkPut(data.students ?? []);
    await db.specProfiles.bulkPut(data.specProfiles ?? []);
    await db.historySamples.bulkPut(data.historySamples ?? []);
    await db.feedbacks.bulkPut(data.feedbacks ?? []);
    await db.tokenUsage.bulkPut(data.tokenUsage ?? []);
    await db.settings.bulkPut(data.settings ?? []);
  });
}

export { setLastBackupAt };
