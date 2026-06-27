import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { NotificationProvider } from "../../src/components/NotificationProvider";
import { useNotify } from "../../src/hooks/useNotify";

function Hook() {
  const notify = useNotify();
  return (
    <div>
      <button onClick={() => notify.success("成功啦")}>ok</button>
      <button onClick={() => notify.error("失败啦")}>err</button>
      <button onClick={() => notify.info("进行中", { duration: 0 })}>info</button>
      <button onClick={() => notify.info("短暂")}>info3</button>
    </div>
  );
}

function renderApp() {
  return render(<NotificationProvider><Hook /></NotificationProvider>);
}

describe("NotificationProvider Toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("success 渲染并 3s 后自动消失", () => {
    renderApp();
    fireEvent.click(screen.getByText("ok"));
    expect(screen.getByText("成功啦")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("成功啦")).not.toBeInTheDocument();
  });

  it("error 渲染并 5s 后自动消失", () => {
    renderApp();
    fireEvent.click(screen.getByText("err"));
    expect(screen.getByText("失败啦")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.queryByText("失败啦")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("失败啦")).not.toBeInTheDocument();
  });

  it("info duration:0 不自动消失", () => {
    renderApp();
    fireEvent.click(screen.getByText("info"));
    expect(screen.getByText("进行中")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("进行中")).toBeInTheDocument();
  });

  it("info 默认 3s 消失", () => {
    renderApp();
    fireEvent.click(screen.getByText("info3"));
    expect(screen.getByText("短暂")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("短暂")).not.toBeInTheDocument();
  });

  it("dismiss() 清全部", () => {
    function H2() {
      const n = useNotify();
      return (
        <div>
          <button onClick={() => n.success("A")}>a</button>
          <button onClick={() => n.success("B")}>b</button>
          <button onClick={() => n.dismiss()}>clearAll</button>
        </div>
      );
    }
    render(<NotificationProvider><H2 /></NotificationProvider>);
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("b"));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    fireEvent.click(screen.getByText("clearAll"));
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });

  it("Toast 超过 4 个自动清最早的", () => {
    function H3() {
      const n = useNotify();
      return (
        <div>
          <button onClick={() => n.success("一")}>1</button>
          <button onClick={() => n.success("二")}>2</button>
          <button onClick={() => n.success("三")}>3</button>
          <button onClick={() => n.success("四")}>4</button>
          <button onClick={() => n.success("五")}>5</button>
        </div>
      );
    }
    render(<NotificationProvider><H3 /></NotificationProvider>);
    fireEvent.click(screen.getByText("1"));
    fireEvent.click(screen.getByText("2"));
    fireEvent.click(screen.getByText("3"));
    fireEvent.click(screen.getByText("4"));
    fireEvent.click(screen.getByText("5"));
    expect(screen.queryByText("一")).not.toBeInTheDocument();
    expect(screen.getByText("五")).toBeInTheDocument();
  });

  it("useNotify 未在 Provider 内使用抛错", () => {
    function Bad() { useNotify(); return null; }
    expect(() => render(<Bad />)).toThrow(/NotificationProvider/);
  });

  it("confirm 点确认 resolve(true)", async () => {
    let result: boolean | null = null;
    function H4() {
      const n = useNotify();
      return (
        <div>
          <button onClick={async () => { result = await n.confirm("删除", "确认？"); }}>ask</button>
        </div>
      );
    }
    render(<NotificationProvider><H4 /></NotificationProvider>);
    fireEvent.click(screen.getByText("ask"));
    expect(screen.getByText("确认？")).toBeInTheDocument();
    fireEvent.click(screen.getByText("确认"));
    await act(async () => { await Promise.resolve(); });
    expect(result).toBe(true);
  });

  it("confirm 点取消 resolve(false)", async () => {
    let result: boolean | null = null;
    function H5() {
      const n = useNotify();
      return (
        <div>
          <button onClick={async () => { result = await n.confirm("删除", "确认？"); }}>ask</button>
        </div>
      );
    }
    render(<NotificationProvider><H5 /></NotificationProvider>);
    fireEvent.click(screen.getByText("ask"));
    fireEvent.click(screen.getByText("取消"));
    await act(async () => { await Promise.resolve(); });
    expect(result).toBe(false);
  });

  it("confirm 点遮罩 resolve(false)", async () => {
    let result: boolean | null = null;
    function H6() {
      const n = useNotify();
      return (
        <div>
          <button onClick={async () => { result = await n.confirm("删除", "确认？"); }}>ask</button>
        </div>
      );
    }
    const { container } = render(<NotificationProvider><H6 /></NotificationProvider>);
    fireEvent.click(screen.getByText("ask"));
    const overlay = document.body.querySelector(".notify-overlay") as HTMLElement;
    fireEvent.click(overlay);
    await act(async () => { await Promise.resolve(); });
    expect(result).toBe(false);
  });
});
