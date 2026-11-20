import { ArrowUpRight, FolderKanban, MessageCircle, Users } from "lucide-react";
import type { DemoVariant } from "../../demo/types";

type OnboardingScreenProps = {
  variant: DemoVariant;
  onStart: () => void;
};

export function OnboardingScreen({ variant, onStart }: OnboardingScreenProps) {
  const optimized = variant === "optimized";

  return (
    <div className="screen onboarding-screen">
      <div className="app-header">
        <button className="round-button" aria-label="打开侧边栏">
          <span className="hamburger" />
        </button>
        <div>
          <strong>WorkBuddy</strong>
          <small>云端空间</small>
        </div>
      </div>

      <div className="onboarding-background" aria-hidden="true">
        <h2>WorkBuddy，我帮你</h2>
        <div className="ghost-chip">进行数据分析及可视化</div>
        <div className="ghost-chip">制作一份幻灯片</div>
        <div className="ghost-chip">深度研究</div>
      </div>

      <div className="screen-scrim" />
      <section className={`upgrade-sheet ${optimized ? "is-optimized" : ""}`}>
        <div className="upgrade-visual" aria-hidden="true">
          <div className="visual-window">
            <div className="visual-dots" />
            <div className="visual-project">
              <FolderKanban size={21} />
              <span>产品设计项目</span>
            </div>
            <div className="visual-row">
              <MessageCircle size={16} />
              <span>频道讨论</span>
            </div>
            <div className="visual-row">
              <Users size={16} />
              <span>成员与资料</span>
            </div>
          </div>
          <div className="upgrade-orbit">
            <ArrowUpRight size={22} />
          </div>
        </div>

        <div className="sheet-copy">
          <span className="new-badge">{optimized ? "项目能力升级" : "新功能"}</span>
          <h2>{optimized ? "把频道升级为项目" : "项目全新升级"}</h2>
          <p>
            {optimized
              ? "原来的消息、成员、资料和任务都会保留，升级后可以在一个项目里继续协作。"
              : "项目体验全新升级。你可以把已有频道一键升级为项目，继续开展协作。"}
          </p>
        </div>

        <button className="primary-button" onClick={onStart}>
          立即体验
        </button>
        <button className="text-button">暂时不用</button>
      </section>
    </div>
  );
}
