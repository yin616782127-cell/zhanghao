import { AlertCircle, Check, ChevronRight, FolderKanban } from "lucide-react";
import { channels } from "../../demo/demoData";
import type { DemoVariant } from "../../demo/types";

type UpgradeResultScreenProps = {
  variant: DemoVariant;
  selectedIds: string[];
  partialFailure: boolean;
  onEnterProject: () => void;
  onRetry: () => void;
};

export function UpgradeResultScreen({
  variant,
  selectedIds,
  partialFailure,
  onEnterProject,
  onRetry,
}: UpgradeResultScreenProps) {
  const optimized = variant === "optimized";
  const selected = channels.filter((channel) => selectedIds.includes(channel.id));
  const failedCount = partialFailure ? 1 : 0;
  const successCount = selected.length - failedCount;

  return (
    <div className="screen result-screen">
      <div className={`result-mark ${partialFailure ? "is-warning" : ""}`}>
        {partialFailure ? <AlertCircle size={34} /> : <Check size={34} strokeWidth={3} />}
      </div>
      <span className="result-kicker">{partialFailure ? "部分完成" : "全部完成"}</span>
      <h2>{partialFailure ? "有 1 个项目升级失败" : "升级完成"}</h2>
      <p>
        {optimized
          ? `已成功创建 ${successCount} 个项目，消息、成员、资料和任务已完整保留。`
          : `已成功将 ${successCount} 个频道升级为项目。`}
      </p>

      {optimized ? (
        <div className="result-stats">
          <div><b>{successCount}</b><span>升级成功</span></div>
          <div><b>{failedCount}</b><span>需要重试</span></div>
        </div>
      ) : null}

      <div className="created-projects">
        {selected.slice(0, successCount).map((channel) => (
          <button key={channel.id} onClick={onEnterProject}>
            <span className="project-icon"><FolderKanban size={19} /></span>
            <span>
              <strong>{channel.name.replace("讨论", "")}项目</strong>
              <small>刚刚升级</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      <div className="result-actions">
        {partialFailure ? (
          <button className="secondary-button" onClick={onRetry}>重试失败项</button>
        ) : null}
        <button className="primary-button" onClick={onEnterProject}>进入项目</button>
      </div>
    </div>
  );
}
