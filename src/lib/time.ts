// 显式指定中国时区，不依赖运行环境系统时区
// 教培老师都在中国，固定 Asia/Shanghai 最严谨
const dayFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric", month: "2-digit", day: "2-digit",
});

/** 把毫秒时间戳转成中国时区的 YYYY-MM-DD 日期字符串 */
export function localDay(ts: number): string {
  const parts = dayFmt.formatToParts(new Date(ts));
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}
