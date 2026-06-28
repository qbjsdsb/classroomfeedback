import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../src/hooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
});

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("dark") && matches,
    media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
  }));
}

describe("useTheme", () => {
  it("无 localStorage 时默认 theme=warm, mode=system", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("warm");
    expect(result.current.mode).toBe("system");
    expect(result.current.resolvedMode).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("warm");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("system 模式 + 系统浅色 → resolvedMode=light", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedMode).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("setTheme 写 cf-theme 并设置 data-theme 属性", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("green"));
    expect(result.current.theme).toBe("green");
    expect(localStorage.getItem("cf-theme")).toBe("green");
    expect(document.documentElement.getAttribute("data-theme")).toBe("green");
    vi.unstubAllGlobals();
  });

  it("setMode 写 cf-mode", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    expect(result.current.mode).toBe("dark");
    expect(localStorage.getItem("cf-mode")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("setMode(system) 时 resolvedMode 跟随系统", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    expect(result.current.resolvedMode).toBe("dark");
    act(() => result.current.setMode("system"));
    expect(result.current.mode).toBe("system");
    expect(result.current.resolvedMode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("toggleMode: light → dark", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("light"));
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("dark");
    expect(result.current.resolvedMode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("toggleMode: dark → light", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("light");
    expect(result.current.resolvedMode).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("toggleMode: system(resolved=dark) → light（脱离 system）", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedMode).toBe("dark");
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("light");
    expect(result.current.resolvedMode).toBe("light");
    expect(localStorage.getItem("cf-mode")).toBe("light");
    vi.unstubAllGlobals();
  });

  it("迁移：旧 theme=light key → cf-mode，删除旧 key", () => {
    localStorage.setItem("theme", "light");
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(localStorage.getItem("cf-mode")).toBe("light");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(result.current.mode).toBe("light");
    vi.unstubAllGlobals();
  });

  it("迁移：旧 theme=dark key → cf-mode", () => {
    localStorage.setItem("theme", "dark");
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(localStorage.getItem("cf-mode")).toBe("dark");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(result.current.mode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("读已有 cf-theme 时用已存值", () => {
    localStorage.setItem("cf-theme", "purple");
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("purple");
    expect(document.documentElement.getAttribute("data-theme")).toBe("purple");
    vi.unstubAllGlobals();
  });
});
