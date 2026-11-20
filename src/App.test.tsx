import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("WorkBuddy upgrade demo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("completes the original channel upgrade flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "立即体验" }));
    await user.click(screen.getByRole("checkbox", { name: "产品设计讨论" }));
    await user.click(screen.getByRole("button", { name: "下一步" }));
    await user.click(screen.getByRole("button", { name: "确认升级" }));

    expect(await screen.findByText("升级完成", {}, { timeout: 5000 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "进入项目" }));
    expect(screen.getByRole("heading", { name: "产品设计项目" })).toBeInTheDocument();
  }, 7000);

  it("preserves the current flow step while switching variants", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "立即体验" }));
    expect(screen.getByText("选择要升级的频道")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "优化版" }));

    expect(screen.getByText("选择要升级的频道")).toBeInTheDocument();
    expect(screen.getByText("消息、成员、资料和任务都会保留")).toBeInTheDocument();
  });

  it("does not allow continuing without a channel selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "立即体验" }));

    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
  });

  it("lets reviewers turn on the partial failure scenario", async () => {
    const user = userEvent.setup();
    render(<App />);

    const failureControl = screen.getByRole("button", { name: "模拟部分失败" });
    await user.click(failureControl);

    expect(failureControl).toHaveAttribute("aria-pressed", "true");
  });
});
