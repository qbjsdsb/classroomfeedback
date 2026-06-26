import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { getApiKey, saveApiKey, getLastBackupAt, setLastBackupAt } from "../../src/hooks/useSettings";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("settings", () => {
  it("saves and gets api key", async () => {
    await saveApiKey("sk-xxx");
    expect(await getApiKey()).toBe("sk-xxx");
  });
  it("returns empty when no key", async () => {
    expect(await getApiKey()).toBe("");
  });
  it("tracks last backup time", async () => {
    const t = Date.now();
    await setLastBackupAt(t);
    expect(await getLastBackupAt()).toBe(t);
  });
});
