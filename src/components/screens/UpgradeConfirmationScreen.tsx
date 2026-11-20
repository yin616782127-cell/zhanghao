import { CheckCircle2, ChevronLeft, FileText, ListTodo, MessageSquareText, Users } from "lucide-react";
import { channels } from "../../demo/demoData";
import type { DemoVariant } from "../../demo/types";

type UpgradeConfirmationScreenProps = {
  variant: DemoVariant;
  selectedIds: string[];
  projectNames: Record<string, string>;
  onRename: (channelId: string, name: string) => void;
  onConfirm: () => void;
  onBack: () => void;
};

export function UpgradeConfirmationScreen({
  variant,
  selectedIds,
  projectNames,
  onRename,
  onConfirm,
  onBack,
}: UpgradeConfirmationScreenProps) {
  const optimized = variant === "optimized";
  const selected = channels.filter((channel) => selectedIds.includes(channel.id));
  const namesValid = selected.every((channel) =>
    (projectNames[channel.id] ?? `${channel.name.replace("讨论", "")}项目`).trim(),
  );

  return (
    <div className="screen confirm-screen">
      <header className="mobile-nav">
        <button className="nav-icon" aria-label="返回" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <strong>确认升级</strong>
          <small>{optimized ? "确认项目名称与迁移内容" : `${selected.length} 个频道`}</small>
        </div>
        <span className="nav-spacer" />
      </header>

      {optimized ? (
        <section className="migration-card">
          <strong>升级后，原内容都会保留</strong>
          <div className="migration-grid">
            <span><MessageSquareText size={17} />频道消息</span>
            <span><Users size={17} />成员权限</span>
            <span><FileText size={17} />共享资料</span>
            <span><ListTodo size={17} />任务记录</span>
          </div>
        </section>
      ) : (
        <p className="plain-hint">频道将升级为项目，你可以修改升级后的项目名称。</p>
      )}

      <div className="mapping-list">
        {selected.map((channel) => {
          const value = projectNames[channel.id] ?? `${channel.name.replace("讨论", "")}项目`;
          return (
            <section className="mapping-card" key={channel.id}>
              <div className="mapping-source">
                <span className="channel-avatar" style={{ background: channel.accent }}>
                  {channel.name.slice(0, 1)}
                </span>
                <div>
                  <small>原频道</small>
                  <strong>{channel.name}</strong>
                </div>
                <CheckCircle2 size={20} className="success-icon" />
              </div>
              <label>
                <span>升级后的项目名称</span>
                <input
                  aria-label={`${channel.name}的项目名称`}
                  value={value}
                  onChange={(event) => onRename(channel.id, event.target.value)}
                />
              </label>
            </section>
          );
        })}
      </div>

      <footer className="sticky-action">
        <button className="primary-button" onClick={onConfirm} disabled={!namesValid}>
          确认升级
        </button>
        {optimized ? <p>升级期间你可以离开页面，完成后会通知你</p> : null}
      </footer>
    </div>
  );
}
