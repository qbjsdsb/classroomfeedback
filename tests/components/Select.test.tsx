import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../../src/components/Select";

describe("Select", () => {
  it("value=null 时显示 placeholder", () => {
    render(
      <Select value={null} options={[{ value: 1, label: "张三" }]} placeholder="选择学生…" onChange={() => {}} />
    );
    expect(screen.getByText("选择学生…")).toBeInTheDocument();
  });

  it("value 匹配时显示对应 label", () => {
    render(
      <Select value={2} options={[{ value: 1, label: "张三" }, { value: 2, label: "李四" }]} onChange={() => {}} />
    );
    expect(screen.getByText("李四")).toBeInTheDocument();
  });

  it("点击展开后选 option 触发 onChange", () => {
    const onChange = vi.fn();
    render(
      <Select value={null} options={[{ value: 1, label: "张三" }, { value: 2, label: "李四" }]} placeholder="选" onChange={onChange} />
    );
    fireEvent.click(screen.getByText("选"));
    fireEvent.click(screen.getByText("李四"));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
