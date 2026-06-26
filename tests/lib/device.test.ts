import { describe, it, expect, vi } from "vitest";
import { isDesktop } from "../../src/lib/device";

describe("isDesktop", () => {
  it("returns false on mobile user agent", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)" });
    expect(isDesktop()).toBe(false);
  });
  it("returns true on desktop user agent", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    expect(isDesktop()).toBe(true);
  });
});
