import { describe, expect, it } from "vitest";
import { demoReducer, initialDemoState } from "./demoMachine";

describe("demoReducer", () => {
  it("does not advance from selection without a selected channel", () => {
    const state = { ...initialDemoState, step: "selection" as const };

    expect(demoReducer(state, { type: "NEXT" }).step).toBe("selection");
  });

  it("advances after selecting a channel", () => {
    const selected = demoReducer(
      { ...initialDemoState, step: "selection" as const },
      { type: "TOGGLE_CHANNEL", channelId: "design" },
    );

    expect(demoReducer(selected, { type: "NEXT" }).step).toBe("confirmation");
  });

  it("keeps the current step when switching visual variants", () => {
    const state = { ...initialDemoState, step: "confirmation" as const };

    expect(
      demoReducer(state, { type: "SET_VARIANT", variant: "optimized" }),
    ).toMatchObject({
      step: "confirmation",
      variant: "optimized",
    });
  });

  it("reset restores the complete initial flow", () => {
    const dirty = {
      ...initialDemoState,
      step: "result" as const,
      selectedChannelIds: ["design"],
      progress: 100,
    };

    expect(demoReducer(dirty, { type: "RESET" })).toEqual(initialDemoState);
  });
});
