import { describe, it, expect } from "vitest";
import { localDay } from "../../src/lib/time";

describe("localDay", () => {
  // 中国时区 UTC+8，以下用例固定 timestamp，不依赖运行环境
  it("北京时间 2026-06-27 00:00 归为 2026-06-27（非前一天）", () => {
    // UTC 2026-06-26 16:00 = 北京 2026-06-27 00:00
    const ts = Date.UTC(2026, 5, 26, 16, 0, 0);
    expect(localDay(ts)).toBe("2026-06-27");
  });

  it("北京时间 2026-06-26 23:59 归为 2026-06-26", () => {
    const ts = Date.UTC(2026, 5, 26, 15, 59, 0);
    expect(localDay(ts)).toBe("2026-06-26");
  });

  it("北京时间 2026-06-26 08:00 归为 2026-06-26（当天）", () => {
    const ts = Date.UTC(2026, 5, 26, 0, 0, 0);
    expect(localDay(ts)).toBe("2026-06-26");
  });

  it("北京时间 2026-06-26 07:59 归为 2026-06-26（边界，UTC 前一天 23:59）", () => {
    const ts = Date.UTC(2026, 5, 25, 23, 59, 0);
    expect(localDay(ts)).toBe("2026-06-26");
  });
});
