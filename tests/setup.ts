import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// HeadlessUI 在 jsdom 下需要 ResizeObserver polyfill
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
