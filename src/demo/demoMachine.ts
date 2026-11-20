import { channels, stepOrder } from "./demoData";
import type { DemoAction, DemoState } from "./types";

export const initialDemoState: DemoState = {
  variant: "original",
  step: "onboarding",
  selectedChannelIds: [],
  projectNames: {},
  progress: 0,
  partialFailure: false,
};

export function canContinue(state: DemoState): boolean {
  if (state.step === "selection") return state.selectedChannelIds.length > 0;
  if (state.step === "confirmation") {
    return state.selectedChannelIds.every((id) => {
      const fallback = channels.find((channel) => channel.id === id)?.name ?? "";
      return (state.projectNames[id] ?? fallback).trim().length > 0;
    });
  }
  return true;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "SET_VARIANT":
      return { ...state, variant: action.variant };
    case "GO_TO":
      return { ...state, step: action.step };
    case "NEXT": {
      if (!canContinue(state)) return state;
      const currentIndex = stepOrder.indexOf(state.step);
      const nextStep = stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
      return { ...state, step: nextStep };
    }
    case "BACK": {
      const currentIndex = stepOrder.indexOf(state.step);
      const previousStep = stepOrder[Math.max(currentIndex - 1, 0)];
      return { ...state, step: previousStep };
    }
    case "TOGGLE_CHANNEL": {
      const selected = state.selectedChannelIds.includes(action.channelId);
      const selectedChannelIds = selected
        ? state.selectedChannelIds.filter((id) => id !== action.channelId)
        : [...state.selectedChannelIds, action.channelId];
      return { ...state, selectedChannelIds };
    }
    case "RENAME_PROJECT":
      return {
        ...state,
        projectNames: {
          ...state.projectNames,
          [action.channelId]: action.name,
        },
      };
    case "SET_PROGRESS":
      return { ...state, progress: Math.max(0, Math.min(action.progress, 100)) };
    case "SET_PARTIAL_FAILURE":
      return { ...state, partialFailure: action.enabled };
    case "RESET":
      return initialDemoState;
  }
}
