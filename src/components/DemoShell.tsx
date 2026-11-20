import { ChevronLeft, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { stepLabels, stepOrder } from "../demo/demoData";
import type { DemoStep, DemoVariant } from "../demo/types";
import { PhoneChrome } from "./PhoneChrome";

type DemoShellProps = {
  children: ReactNode;
  variant: DemoVariant;
  step: DemoStep;
  partialFailure: boolean;
  onVariantChange: (variant: DemoVariant) => void;
  onPartialFailureChange: (enabled: boolean) => void;
  onBack: () => void;
  onReset: () => void;
};

export function DemoShell({
  children,
  variant,
  step,
  partialFailure,
  onVariantChange,
  onPartialFailureChange,
  onBack,
  onReset,
}: DemoShellProps) {
  const stepIndex = stepOrder.indexOf(step);

  return (
    <main className="demo-shell">
      <header className="review-toolbar">
        <div>
          <p className="eyebrow">WORKBUDDY · INTERACTIVE PROTOTYPE</p>
          <h1>频道升级项目</h1>
        </div>

        <div className="review-controls">
          <div className="variant-switch" aria-label="版本切换">
            <button
              className={variant === "original" ? "is-active" : ""}
              aria-pressed={variant === "original"}
              onClick={() => onVariantChange("original")}
            >
              原稿版
            </button>
            <button
              className={variant === "optimized" ? "is-active" : ""}
              aria-pressed={variant === "optimized"}
              onClick={() => onVariantChange("optimized")}
            >
              优化版
            </button>
          </div>
          <button
            className="toolbar-icon"
            aria-label="上一步"
            onClick={onBack}
            disabled={step === "onboarding"}
          >
            <ChevronLeft size={17} />
            上一步
          </button>
          <button className="toolbar-icon" aria-label="重新演示" onClick={onReset}>
            <RotateCcw size={16} />
            重新演示
          </button>
          <button
            className={`toolbar-icon ${partialFailure ? "is-enabled" : ""}`}
            aria-label="模拟部分失败"
            aria-pressed={partialFailure}
            onClick={() => onPartialFailureChange(!partialFailure)}
          >
            模拟部分失败
          </button>
        </div>
      </header>

      <section className="prototype-stage">
        <aside className="step-rail" aria-label="演示步骤">
          <p>流程进度</p>
          {stepLabels.map((label, index) => (
            <div
              className={`step-item ${index === stepIndex ? "is-current" : ""} ${
                index < stepIndex ? "is-complete" : ""
              }`}
              key={label}
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </aside>

        <div className="phone-stage">
          <div className="device-frame">
            <PhoneChrome>{children}</PhoneChrome>
          </div>
          <p className="stage-caption">
            {variant === "original" ? "原稿还原" : "体验优化"} · 第 {stepIndex + 1} / 6 步
          </p>
        </div>

        <aside className="mode-note">
          <span>{variant === "original" ? "ORIGINAL" : "OPTIMIZED"}</span>
          <h2>{variant === "original" ? "保持原有结构" : "强化过程反馈"}</h2>
          <p>
            {variant === "original"
              ? "按源设计复现入口、选择、升级和完成页面。"
              : "业务流程不变，优化信息说明、选择反馈和结果行动。"}
          </p>
        </aside>
      </section>
    </main>
  );
}
