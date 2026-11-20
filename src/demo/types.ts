export type DemoVariant = "original" | "optimized";

export type DemoStep =
  | "onboarding"
  | "selection"
  | "confirmation"
  | "progress"
  | "result"
  | "project";

export type Channel = {
  id: string;
  name: string;
  subtitle: string;
  memberCount: number;
  messageCount: number;
  accent: string;
};

export type DemoState = {
  variant: DemoVariant;
  step: DemoStep;
  selectedChannelIds: string[];
  projectNames: Record<string, string>;
  progress: number;
  partialFailure: boolean;
};

export type DemoAction =
  | { type: "SET_VARIANT"; variant: DemoVariant }
  | { type: "GO_TO"; step: DemoStep }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "TOGGLE_CHANNEL"; channelId: string }
  | { type: "RENAME_PROJECT"; channelId: string; name: string }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_PARTIAL_FAILURE"; enabled: boolean }
  | { type: "RESET" };
