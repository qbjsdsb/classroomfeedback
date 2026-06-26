export function isDesktop(): boolean {
  const ua = (navigator?.userAgent ?? "").toLowerCase();
  return !/iphone|ipad|ipod|android|mobile/.test(ua);
}
