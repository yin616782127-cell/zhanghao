import {
  Bell,
  ChevronLeft,
  FileText,
  ListTodo,
  MessageCircle,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { channels } from "../../demo/demoData";
import type { DemoVariant } from "../../demo/types";

type ProjectHomeScreenProps = {
  variant: DemoVariant;
  selectedIds: string[];
  onBack: () => void;
};

export function ProjectHomeScreen({ variant, selectedIds, onBack }: ProjectHomeScreenProps) {
  const optimized = variant === "optimized";
  const primary = channels.find((channel) => selectedIds.includes(channel.id)) ?? channels[0];
  const projectName = `${primary.name.replace("讨论", "")}项目`;

  return (
    <div className="screen project-screen">
      <header className="project-header">
        <button className="nav-icon" aria-label="返回" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="project-title">
          <span className="channel-avatar" style={{ background: primary.accent }}>
            {primary.name.slice(0, 1)}
          </span>
          <div>
            <strong>{projectName}</strong>
            <small>{primary.memberCount} 位成员</small>
          </div>
        </div>
        <button className="nav-icon" aria-label="更多操作"><MoreHorizontal size={21} /></button>
      </header>

      <section className={`success-tip ${optimized ? "is-optimized" : ""}`}>
        <span><Bell size={16} /></span>
        <div>
          <strong>{optimized ? "升级完成，原内容已全部归入项目" : "项目升级成功"}</strong>
          <p>{optimized ? "频道消息、成员、资料和任务均已保留。" : "你可以在这里继续开展协作。"}</p>
        </div>
      </section>

      <section className="project-hero">
        <p>项目</p>
        <h2>{projectName}</h2>
        <span>让信息、任务和协作集中在一起</span>
        <div className="member-stack" aria-label="项目成员">
          {["林", "周", "陈", "王"].map((name, index) => (
            <b key={name} style={{ zIndex: 4 - index }}>{name}</b>
          ))}
          <em>+{Math.max(primary.memberCount - 4, 0)}</em>
        </div>
      </section>

      <section className="project-modules">
        <button><MessageCircle size={21} /><span><strong>讨论</strong><small>{primary.messageCount} 条消息</small></span></button>
        <button><ListTodo size={21} /><span><strong>任务</strong><small>8 项进行中</small></span></button>
        <button><FileText size={21} /><span><strong>资料</strong><small>24 份文档</small></span></button>
        <button><Users size={21} /><span><strong>成员</strong><small>{primary.memberCount} 人</small></span></button>
      </section>

      <section className="recent-section">
        <div className="section-title"><strong>最近动态</strong><span>查看全部</span></div>
        <article>
          <span className="activity-avatar">林</span>
          <div>
            <p><b>林小满</b> 更新了项目方案</p>
            <small>频道升级项目体验优化 · 10 分钟前</small>
          </div>
        </article>
        <article>
          <span className="activity-avatar alt">周</span>
          <div>
            <p><b>周泽</b> 完成了 2 项任务</p>
            <small>视觉走查、埋点确认 · 35 分钟前</small>
          </div>
        </article>
      </section>
    </div>
  );
}
