# 个人 Agent 竞品分析（产品 × 体验）

> 面向交互设计师的 Personal Agent 横评  
> 样本：Grok Bot、Muse、OpenAI dots、Manus Cue、腾讯 WorkBuddy  
> 信息截止：约 2026 年 9–10 月公开资料

---

## 1. 分析范围与选型

**Personal Agent** 在此定义为：属于个人的、可持续工作的 AI agent——具备记忆、连接个人应用、拥有（云端或本机）执行环境，且可不依赖每次用户开口而主动推进任务。

| # | 产品 | 厂商 | 选型理由 |
|---|------|------|----------|
| 1 | **Grok Bot** | SpaceXAI（原 xAI） | 指定竞品；「持久队友 + 云电脑」范式代表 |
| 2 | **Muse** | Meta | 指定竞品；消费级、大众化 personal agent |
| 3 | **dots** | OpenAI | ChatGPT 生态入口最大；工作流型 always-on agent |
| 4 | **Cue** | Manus | 独立身份（邮箱/电话/钱包）差异化最强 |
| 5 | **WorkBuddy** | 腾讯 | 国内代表；本机执行 + 办公 IM 遥控器 |

未纳入但可对照：Claude Cowork、Gemini Spark、阿里千问办公 / QoderWake、扣子 Coze。

---

## 2. 一句话定位

| 产品 | 定位一句话 | 核心隐喻 |
|------|------------|----------|
| Grok Bot | 可交给真活的 AI 队友团队 | 同事 / 小团队 |
| Muse | 为十亿人设计的个人办事 agent | 生活助理 |
| dots | 始终在线、什么都能处理的个人 agent | 贴身搭档（blob） |
| Cue | 拥有独立身份的个人 agents | 有身份的数字人 |
| WorkBuddy | 开箱即用的职场 AI 智能同事 | 办公工作台 |

---

## 3. 产品层对比

### 3.1 运行环境与能力边界

| 维度 | Grok Bot | Muse | dots | Cue | WorkBuddy |
|------|----------|------|------|-----|-----------|
| 默认执行环境 | 账号共用一台云 Linux | 每人一台 Secure VM | 自有云电脑；可授权连本机 | 每 agent 一台电脑 + 身份资产 | 默认本机；手机/企业可云端 |
| 浏览器 / 桌面操作 | 强 | 强（Secure VM + 浏览器） | 强 | 强 | 本机文件与工具为主 |
| App 连接 | MCP / 插件 / Skills | Connectors（邮箱、日历、Meta 系等） | 4000+ plugins 生态 | Trip.com、Gmail、健康类等 | 微信/企微等 IM + 本地技能 |
| 主动触发 | Routines（日程/事件） | 目标驱动、后台推进 | 常在线、可主动研究 | Routines + 外联身份 | 定时自动化 |
| 支付 / 下单 | 偏工作流，需审批 | 支持（Link by Stripe 一次性卡） | 部分支持 | 自有钱包 + 预算 | 弱（偏办公交付） |
| 多 Agent | Bot 群聊互派 | 单主人、单 Muse | 当前主推 primary dot， foreshadow 团队 | 多 agent 群聊协作 | 多专家 / 多 Agent 并行 |

**产品洞察：**

1. **「给 agent 一台电脑」已成为品类标配**——没有浏览器与文件系统，就只能停在有 API 的集成边界内。
2. **海内外分叉清晰**：海外四款偏「单主人私有云电脑」；国内 WorkBuddy 从「本机文件 + 企微群派活」长出来。
3. **能力重心不同**：Muse/Cue 更偏生活消费与外联；dots/Grok 更偏知识工作与工作流；WorkBuddy 更偏文档/表格/PPT 等可验收办公交付物。

### 3.2 入口与平台策略

| 产品 | 主入口 | 策略含义 |
|------|--------|----------|
| Grok Bot | 桌面、iOS/Android、特斯拉车机；与 Cursor 打通 | 高价值订阅用户 + 开发者/生产力圈 |
| Muse | 独立 App、muse.ai、WhatsApp | 借 Meta 社交入口做「人人会用」 |
| dots | ChatGPT、Slack、Teams（短信 waitlist） | 寄生最大对话与协作入口，降低换产品成本 |
| Cue | 独立 App（Web/桌面/手机） | 品类独立心智：不是聊天室附属功能 |
| WorkBuddy | 桌面工作台 + 多 IM 遥控器 | 中文办公场景渗透；IM 是遥控器而非本体 |

**体验设计含义：**入口决定用户的**心理模型**。嵌在 ChatGPT/WhatsApp 里的 agent，用户更容易当成「更会干活的聊天」；独立 App（Cue、Muse、WorkBuddy）更容易建立「我有一个数字同事」的对象感。

### 3.3 商业与可得性（简表）

| 产品 | 定价印象 | 门槛 |
|------|----------|------|
| Grok Bot | SuperGrok / Cursor 订阅档 | 付费墙较高 |
| Muse | 免费档 + $20 / $100 | 消费级下探最深 |
| dots | 含在 Pro / Business Premium（约 $100 档） | 高客单，工作向 |
| Cue | 早期邀请码免费 | 稀缺感、尝鲜 |
| WorkBuddy | 免费积分 + Pro/Team | 国内上手成本低，复杂任务吃积分 |

---

## 4. 体验层对比（交互设计重点）

### 4.1 核心对象模型（IA）

Personal Agent 的体验分水岭，往往不在模型能力，而在**用户脑子里要记住几个对象**。

| 产品 | 主对象 | 次对象 | 心智负担 |
|------|--------|--------|----------|
| Grok Bot | **Bot**（有名字、头衔、头像） | Skill、Routine、群聊、云电脑 | 中：对象清晰，但需理解「队友系统」 |
| Muse | **Muse**（单一个人代理） | Goal、Connector、审批 | 低：一人一 Muse，最接近「助理」 |
| dots | **Dot**（可个性化 blob） | Activity、Custom Rules、插件 | 低–中：先一个 primary dot |
| Cue | **Agent Identity**（邮箱/电话/钱包/电脑） | Group chat、Routine、预算 | 中–高：身份资产多，概念新 |
| WorkBuddy | **任务 / 专家 / 技能** | Plan/Craft/Ask 模式、结果区 | 中：功能面宽，新手易懵 |

**设计启示：**

- Grok Bot 把「对话」降级为 Bot 的附属，首页是 **Bot 名册（roster）** 而非 chat history——这是从 chatbot 到 agent 产品最关键的 IA 跃迁。
- Muse 故意不做多 agent，降低学习曲线，换大众可达性。
- Cue 把「身份」做成第一公民，适合需要对外联络的场景，但要教育「agent 有自己的电话/邮箱」这一新概念。

### 4.2 存在感（Presence）与可监督性

| 产品 | 状态表达 | 过程可见性 | 人机接管 |
|------|----------|------------|----------|
| Grok Bot | 头像六态：idle / thinking / working / waiting / blocked / done | 侧栏预览云电脑；标题栏活动色 | 全屏接管输入验证码/登录 |
| Muse | 消息式沟通 + 后台推进 | Secure VM；Sentinel 审批 | 审批弹窗为主 |
| dots | Activity View 看后台工作 | 可打开看电脑操作 | Custom Rules 分级 |
| Cue | 任务推进中回看；通话摘要 | 独立 workspace | 预算与审批边界 |
| WorkBuddy | 任务列表按状态筛选 | 右侧结果区、变更与预览 | Plan 模式先审计划 |

**体验标杆：Grok Bot 的 Presence 设计**

1. 一眼看出 agent **在干活还是在等你**（waiting/blocked 是关键态）。
2. 三级访问：感知（图标）→ 旁观（侧栏）→ 介入（接管）——符合「渐进披露」。
3. 事件进 transcript（创建 Routine、改设置、Bot 互发消息），把系统行为变成可回顾叙事。

这对交互设计师尤其重要：**异步 agent 最大的焦虑不是「它不够聪明」，而是「我不知道它在干嘛、要不要我」**。

### 4.3 指令与协作方式

| 产品 | 主要交互 | 特色交互 |
|------|----------|----------|
| Grok Bot | 聊天派活；@Bot；群聊 | **Teach a task**（演示录制变 Skill）；Routines |
| Muse | 像给人发消息（App/WhatsApp） | 目标 → 计划 → 自主推进；购物/健身等生活场景模板 |
| dots | ChatGPT/Slack/Teams 对话；语音 | 反馈学习偏好；并行深度任务额度 |
| Cue | 设责任 + 跟进；群聊多 agent | 扫码创建 agent；转发电话；餐厅扫码点餐等线下触点 |
| WorkBuddy | 自然语言任务；三种模式 | 专家市场、Skill 商店、结果验收面板 |

**模式设计亮点（WorkBuddy）：**

- **Ask / Plan / Craft** 把「聊 / 先计划 / 直接干」做成显式模式，对应风险与成本（积分）——是少有的把 **人机协作紧密度**做成一级控件的产品。
- 反面：入口与概念（专家、技能、插件）过多时，首周体验容易「按聊天习惯用，觉得不好用」——需要 onboarding 把「扔完整任务」教清楚。

### 4.4 信任、审批与安全感

| 产品 | 审批模型 | 安全叙事 |
|------|----------|----------|
| Grok Bot | 逐动作：允许一次 / 总是允许 / 拒绝；自然语言 Agent 规则 + 审查 agent | 隔离环境；敏感登录由人接管 |
| Muse | Sentinel 独立闸门；一次/会话/任务/限时/永久授权 | VM 隔离；agent 不见真凭证；支付用一次性卡 |
| dots | 内置规则 + Custom Rules（允许/需批/禁止） | 模型不可见保存密码；Activity 可审 |
| Cue | 用户设边界 + 消费预算 | 「有身份但权限你控」 |
| WorkBuddy | 高风险强制确认；Plan 模式审计划 | 本机目录授权；沙箱/容器执行 |

**体验原则提炼：**

1. **审批要可预期**：用户需知道「什么会弹、什么不弹」，否则要么骚扰要么恐惧。
2. **闸门最好在 agent 之外**（Muse Sentinel、dots Rules）——心理上更可信。
3. **预算优于无限授权**（Cue 钱包预算、Muse 一次性卡）——对支付场景尤其友好。
4. 行业共同缺口：**他人触发你的 agent 时，不可逆步骤谁批？** 国内协作型产品更需补齐这条体验链路。

### 4.5 主动性与「不打扰」平衡

| 产品 | 主动性来源 | 打扰控制线索 |
|------|------------|--------------|
| Grok Bot | Routine 日程/事件；Bot 互触发 | waiting 态 + 审批；只在判断点拉人 |
| Muse | 目标后台推进、建议 | 敏感动作审批；生活场景高频 nudge 风险需控 |
| dots | always-on、只读主动研究 | Custom Rules + Activity |
| Cue | Routine、外联来电/邮件 | 身份通道本身会引入外部打扰，需强过滤 |
| WorkBuddy | 定时任务 | 任务完成通知；偏事务交付少闲聊 |

**设计张力：**Personal Agent 的价值来自主动性，但主动性过界 = 通知噪音 + 越权感。优秀产品会把「主动」拆成：**只读观察可以勤，写操作必须钝**。

### 4.6 情感化与品牌调性（视觉/人格）

| 产品 | 人格/视觉线索 | 对体验的影响 |
|------|---------------|--------------|
| Grok Bot | 具名队友、头像动效表达工作态 | 强化「同事感」、可监督感 |
| Muse | Meta 消费品牌、消息即交互 | 降低技术感，贴近 WhatsApp |
| dots | 可爱可个性化 blob | 亲和、降低 agent 恐惧；偏娱乐化风险需注意专业场景 |
| Cue | 「独立身份」硬核概念 | 科幻感强，教育成本高，差异化记忆点强 |
| WorkBuddy | 职场工具台、专家角色 | 效率可信，但易显复杂 |

---

## 5. 场景适配矩阵（设计师选型用）

| 用户目标 | 更合适 | 原因 |
|----------|--------|------|
| 生活：购物、订餐、出行、健身目标 | **Muse**、Cue | 消费场景与外联能力强 |
| 知识工作：邮件、Slack、研究、并行任务 | **dots**、Grok Bot | 工作入口与云电脑常在线 |
| 多角色分工、例行自动化 | **Grok Bot**、Cue | Bot/Agent 团队 + Routine |
| 需要对外可被联系（邮箱/电话） | **Cue** | 身份资产独特 |
| 中文办公：周报、PPT、Excel、本地文件 | **WorkBuddy** | 本机文件 + 中文办公交付 |
| 同事在企微/钉钉里派活 | **WorkBuddy**（及千问办公系） | 海外四款基本是单主人 |

---

## 6. 体验差异总结：五条产品轴线

用交互设计师常用的「轴线」看这五款：

```
大众易用 ←————————————→ 专业可编排
   Muse          dots     Grok Bot / WorkBuddy
                 Cue（概念新但场景直观）

生活消费 ←————————————→ 职场生产力
   Muse / Cue              dots / Grok / WorkBuddy

单助理 ←————————————————→ 多 Agent 团队
   Muse / dots(初)         Grok Bot / Cue / WorkBuddy

云隔离电脑 ←————————————→ 本机真实环境
   Muse                    WorkBuddy
   （dots/Grok/Cue 居中，可连本机）

私有单主人 ←————————————→ 可被同事派活
   Muse/dots/Grok/Cue      WorkBuddy
```

---

## 7. 对「做个人 Agent」的设计建议（可落地）

1. **先定主对象**：是「一个 Muse」还是「一名单册的 Bots」？对象模型决定导航、空状态、通知结构。
2. **Presence 必做六态级状态机**：至少区分 idle / working / waiting_on_user / blocked / done；waiting 必须可点击直达原因。
3. **电脑可见性做三级**：角标感知 → 侧栏旁观 → 全屏接管；不要一上来就甩远程桌面。
4. **把 Routine 做成一级对象**：可命名、暂停、回顾结果——否则「主动性」会藏在设置里死掉。
5. **审批按后果分级**：只读 < 发消息 < 改文件 < 花钱/删数据；支持「一次 / 会话 / 永久」与预算上限。
6. **Onboarding 教「扔完整任务」**：WorkBuddy 用户踩坑证明——用聊天习惯用 Agent，会系统性低估产品。
7. **国内产品额外设计「他人派活」审批链**：谁发起、谁可见、谁批准不可逆步骤——这是差异化机会，也是风险点。

---

## 8. 竞品速览卡（可直接贴评审）

### Grok Bot
- **产品**：持久 AI 队友；共用云电脑；Skills + Routines；Bot 间协作。
- **体验**：Roster > Chat；头像状态机；电脑旁观/接管；示教成 Skill。
- **适合学**：异步可监督、多 agent 团队的 IA。

### Muse
- **产品**：大众个人 agent；Secure VM；目标驱动；连接生活 App；可购物支付。
- **体验**：消息即主交互；WhatsApp 入口；Sentinel 审批；低学习曲线。
- **适合学**：消费级信任设计、降低 agent 恐惧。

### OpenAI dots
- **产品**：ChatGPT 生态 always-on agent；云电脑 + 海量插件；Activity + Rules。
- **体验**：寄生已有工作入口；blob 人格化；语音；企业 specialist 路线。
- **适合学**：平台分发、规则化权限、工作场景渗透。

### Manus Cue
- **产品**：每 agent 自有邮箱/电话/钱包/电脑；群聊协作；线下扫码触点。
- **体验**：身份即产品；外联叙事强；预算控支付。
- **适合学**：agent 社会化身份、生活服务闭环。

### 腾讯 WorkBuddy
- **产品**：职场桌面 Agent；本地文件；专家/技能；IM 遥控器；可验收交付物。
- **体验**：Ask/Plan/Craft；任务-结果双栏；中文办公场景深。
- **适合学**：模式化风险控制、交付物导向 UI、本土协作入口。

---

## 9. 参考来源（公开）

- xAI / SpaceXAI：Grok Bot 介绍与设计文、Cursor Grok Bot 文档  
- Meta：Muse 发布说明、App Store、隐私说明  
- OpenAI：Introducing dots、DevDay 2026 Recap  
- Manus：Manus 2.0 / Cue 官网与博客  
- 腾讯：WorkBuddy 产品页与文档、开发者社区体验文  
- 行业横评：muti《Personal Agent 横评》、dotsgpt 个人智能体对比等  

---

*本文侧重产品策略与交互体验框架，非跑分评测；具体能力随版本快速迭代，落地前建议再核对官方文档。*
