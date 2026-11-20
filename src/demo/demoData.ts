import type { Channel } from "./types";

export const channels: Channel[] = [
  {
    id: "design",
    name: "产品设计讨论",
    subtitle: "最近更新：频道升级项目方案",
    memberCount: 18,
    messageCount: 286,
    accent: "#6d63e8",
  },
  {
    id: "launch",
    name: "WorkBuddy 2.0 发布",
    subtitle: "版本排期与上线清单",
    memberCount: 26,
    messageCount: 412,
    accent: "#f5a43c",
  },
  {
    id: "research",
    name: "AI 产品竞品研究",
    subtitle: "Claude、ChatGPT 与 Muse",
    memberCount: 9,
    messageCount: 134,
    accent: "#1fb590",
  },
  {
    id: "weekly",
    name: "产品周会",
    subtitle: "周会纪要与待办跟进",
    memberCount: 12,
    messageCount: 198,
    accent: "#3b88e8",
  },
];

export const stepOrder = [
  "onboarding",
  "selection",
  "confirmation",
  "progress",
  "result",
  "project",
] as const;

export const stepLabels = ["功能引导", "选择频道", "确认升级", "升级中", "完成", "项目首页"];
