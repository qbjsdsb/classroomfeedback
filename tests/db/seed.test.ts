import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/schema";
import { seedBuiltinProfiles, BUILTIN_PROFILES } from "../../src/db/seed";

beforeEach(async () => { await db.delete(); await db.open(); });

describe("seed", () => {
  it("seeds builtin profiles into db", async () => {
    await seedBuiltinProfiles();
    const builtins = await db.specProfiles.filter(p => p.isBuiltin).toArray();
    expect(builtins.length).toBeGreaterThanOrEqual(2);
  });
  it("does not duplicate on re-seed", async () => {
    await seedBuiltinProfiles();
    await seedBuiltinProfiles();
    const builtins = await db.specProfiles.filter(p => p.isBuiltin).toArray();
    expect(builtins.length).toBe(BUILTIN_PROFILES.length);
  });
});
