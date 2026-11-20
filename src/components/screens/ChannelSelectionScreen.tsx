import { Check, ChevronLeft, Search, Users } from "lucide-react";
import { channels } from "../../demo/demoData";
import type { DemoVariant } from "../../demo/types";

type ChannelSelectionScreenProps = {
  variant: DemoVariant;
  selectedIds: string[];
  onToggle: (channelId: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function ChannelSelectionScreen({
  variant,
  selectedIds,
  onToggle,
  onContinue,
  onBack,
}: ChannelSelectionScreenProps) {
  const optimized = variant === "optimized";

  return (
    <div className="screen list-screen">
      <header className="mobile-nav">
        <button className="nav-icon" aria-label="返回" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <strong>选择要升级的频道</strong>
          {optimized ? <small>消息、成员、资料和任务都会保留</small> : null}
        </div>
        <button className="nav-icon" aria-label="搜索频道">
          <Search size={20} />
        </button>
      </header>

      <div className="selection-summary">
        <div>
          <strong>{optimized ? "选择频道" : "可升级频道"}</strong>
          <span>{channels.length} 个可升级</span>
        </div>
        {optimized ? <b>已选 {selectedIds.length} 个</b> : null}
      </div>

      <div className="channel-list">
        {channels.map((channel) => {
          const selected = selectedIds.includes(channel.id);
          return (
            <label className={`channel-row ${selected ? "is-selected" : ""}`} key={channel.id}>
              <input
                type="checkbox"
                aria-label={channel.name}
                checked={selected}
                onChange={() => onToggle(channel.id)}
              />
              <span className="channel-avatar" style={{ background: channel.accent }}>
                {channel.name.slice(0, 1)}
              </span>
              <span className="channel-meta">
                <strong>{channel.name}</strong>
                <small>{channel.subtitle}</small>
                {optimized ? (
                  <em>
                    <Users size={12} /> {channel.memberCount} 人 · {channel.messageCount} 条消息
                  </em>
                ) : null}
              </span>
              <span className="check-control" aria-hidden="true">
                {selected ? <Check size={15} strokeWidth={3} /> : null}
              </span>
            </label>
          );
        })}
      </div>

      <footer className="sticky-action">
        {optimized ? (
          <p>{selectedIds.length ? `将创建 ${selectedIds.length} 个项目` : "至少选择一个频道"}</p>
        ) : null}
        <button
          className="primary-button"
          onClick={onContinue}
          disabled={selectedIds.length === 0}
        >
          下一步
          {optimized && selectedIds.length > 0 ? `（${selectedIds.length}）` : ""}
        </button>
      </footer>
    </div>
  );
}
