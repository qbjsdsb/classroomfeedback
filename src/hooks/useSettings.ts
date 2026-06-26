import { db } from "../db/schema";

const SETTINGS_ID = 1;

export async function getApiKey(): Promise<string> {
  const s = await db.settings.get(SETTINGS_ID);
  return s?.apiKey ?? "";
}
export async function saveApiKey(apiKey: string): Promise<void> {
  const s = await db.settings.get(SETTINGS_ID);
  if (s) await db.settings.update(SETTINGS_ID, { apiKey });
  else await db.settings.add({ id: SETTINGS_ID, apiKey, lastBackupAt: 0 });
}
export async function getLastBackupAt(): Promise<number> {
  const s = await db.settings.get(SETTINGS_ID);
  return s?.lastBackupAt ?? 0;
}
export async function setLastBackupAt(t: number): Promise<void> {
  const s = await db.settings.get(SETTINGS_ID);
  if (s) await db.settings.update(SETTINGS_ID, { lastBackupAt: t });
  else await db.settings.add({ id: SETTINGS_ID, apiKey: "", lastBackupAt: t });
}
