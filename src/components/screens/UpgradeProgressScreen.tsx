import { Check, ChevronLeft, LoaderCircle } from "lucide-react";
import type { DemoVariant } from "../../demo/types";

type UpgradeProgressScreenProps = {
  variant: DemoVariant;
  progress: number;
  selectedCount: number;
  onBack: () => void;
};

export function UpgradeProgressScreen({
  variant,
  progress,
  selectedCount,
  onBack,
}: UpgradeProgressScreenProps) {
  const optimized = variant === "optimized";
  const stages = [
    { label: "整理频道内容", threshold: 25 },
    { label: "迁移成员与权限", threshold: 55 },
    { label: "归入资料与任务", threshold: 82 },
    { label: "完成项目创建", threshold: 100 },
  ];
  const currentStage = stages.find((stage) => progress < stage.threshold)?.label ?? "即将完成";

  return (
    <div className="screen progress-screen">
      <header className="mobile-nav">
        <button className="nav-icon" aria-label="返回" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <strong>项目升级中</strong>
        <span className="nav-spacer" />
      </header>

      <div className="progress-main">
        <div className="progress-orb">
          <svg viewBox="0 0 120 120" aria-label={`升级进度 ${progress}%`}>
            <circle className="progress-track" cx="60" cy="60" r="52" />
            <circle
              className="progress-value"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - progress}
            />
          </svg>
          <span>
            <b>{progress}%</b>
            <small>{selectedCount} 个项目</small>
          </span>
        </div>
        <h2>{optimized ? currentStage : "正在升级，请稍候"}</h2>
        <p>
          {optimized
            ? "你可以先去处理其他事情，升级完成后会通知你。"
            : "升级过程中请不要关闭 WorkBuddy。"}
        </p>
      </div>

      {optimized ? (
        <div className="stage-list">
          {stages.map((stage) => {
            const done = progress >= stage.threshold;
            const active = !done && currentStage === stage.label;
            return (
              <div className={active ? "is-active" : ""} key={stage.label}>
                <span>{done ? <Check size={14} /> : active ? <LoaderCircle size={14} /> : null}</span>
                <strong>{stage.label}</strong>
                <small>{done ? "已完成" : active ? "处理中" : "等待中"}</small>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
