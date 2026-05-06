# 获客模块（Prospect Acquisition）— 工程设计方案

> 附属文档：配合《AI Commerce Ops Dashboard — 工程框架方案》使用
> 版本：v1.0 · 日期：2026-04-30
> 定位：本模块是 AI Commerce Ops Dashboard 的**第四大核心功能区**，专注于「多平台潜在客户发现 → AI 意向评分 → 自动化私信触达」全链路。

---

## 目录

1. [模块定位与设计边界](#1-模块定位与设计边界)
2. [工具矩阵与 GitHub 项目映射](#2-工具矩阵与-github-项目映射)
3. [数据模型（Prisma Schema 扩展）](#3-数据模型prisma-schema-扩展)
4. [Action Flow：获客专用动作流](#4-action-flow获客专用动作流)
5. [连接器层设计](#5-连接器层设计)
6. [API 端点](#6-api-端点)
7. [前端模块设计](#7-前端模块设计)
8. [AI 意向评分引擎](#8-ai-意向评分引擎)
9. [安全与风控标准](#9-安全与风控标准)
10. [里程碑任务分解](#10-里程碑任务分解)

---

## 1. 模块定位与设计边界

### 1.1 核心能力描述

获客模块的工作链路：

```
目标平台搜索条件
  → Python Worker / MCP 工具执行抓取
  → 原始 prospect 数据入库 (prospects 表)
  → AI 意向评分 (ProspectScoringWorker)
  → 分值 >= 阈值 → 进入待触达列表 (outreach_queue)
  → AI 生成个性化私信草稿 (outreach_messages)
  → 进入审批队列 (approval_requests, actionType="outreach.send")
  → 审批通过 → Worker 调用平台连接器发送
  → 结果写入 outreach_results + audit_logs
```

### 1.2 侧边栏位置

在现有三大模块中，**获客**作为第四个顶级模块单独存在：

```
电商运营
媒体运营
► 获客中心              ← 新增
  ├── 任务看板
  ├── 潜客搜索
  ├── 潜客库
  ├── 触达管理
  └── 触达日历
系统设置
```

### 1.3 设计边界（MVP 明确不做）

| 不做 | 原因 |
|------|------|
| 批量自动发私信（无审批） | 高风险，必须每批进入审批 |
| 购买/导入第三方联系人数据库 | 数据合规风险 |
| 自动加好友/关注（LinkedIn/Twitter） | 极易触发封号 |
| 邮件冷外联 | 不在本系统范围 |

---

## 2. 工具矩阵与 GitHub 项目映射

### 2.1 各平台工具选型

| 平台 | 获客方式 | 推荐工具/项目 | 接入策略 | 风险等级 |
|------|----------|---------------|----------|----------|
| **LinkedIn** | 关键词搜人、公司员工列表、相关推荐 | `stickerdaniel/linkedin-mcp-server`（Patchright + Session持久化）| Python Worker 隔离 + 人工登录一次 | 🔴 高 |
| **Twitter/X** | 话题搜推文、用户互动、关键词监听 | `nirholas/XActions`（Browser MCP + CLI，无 API 费）或 `Barresider/x-mcp`（Playwright）| Python Worker / Node Worker | 🟡 中 |
| **Reddit** | 关键词搜帖、subreddit 用户、评论者 | Apify `harshmaur/reddit-scraper` + `scrapio/reddit-lead-scraper` | Apify MCP (`mcp.apify.com`) | 🟢 低 |
| **Instagram 评论区** | 竞品帖子评论者、话题标签用户 | Apify `apify/instagram-scraper` | Apify MCP | 🟡 中 |
| **TikTok 评论区** | 竞品视频评论者、话题用户 | Apify `clockworks/tiktok-scraper` | Apify MCP | 🟡 中 |
| **小红书** | 竞品笔记评论者、话题搜索用户 | `xiaohongshu-mcp`（已在媒体模块） + Playwright 自定义 | Python Worker 沙箱 | 🔴 高 |
| **抖音** | 竞品视频互动用户 | Playwright + Cookie（同媒体模块）| Python Worker 沙箱 | 🔴 高 |
| **跨境论坛/独立站** | 关键词搜索结果、论坛帖子用户 | Apify `apify/web-scraper` + Google 自定义搜索 API | Apify MCP | 🟢 低 |
| **Google Maps** | 本地商户联系方式（B2B 场景）| Apify `compass/google-maps-scraper` | Apify MCP | 🟢 低 |

### 2.2 工具详细说明

**LinkedIn MCP Server（首选）**
```
GitHub: stickerdaniel/linkedin-mcp-server
PyPI:   linkedin-scraper-mcp
运行:   uvx linkedin-scraper-mcp@latest --transport streamable-http --port 8080
特点:
  - Patchright（Playwright 的反检测分支）驱动
  - Session 持久化至 ~/.linkedin-mcp/，登录一次长期有效
  - 工具调用串行队列，保护共享浏览器 session
  - 支持获取: profile、experience、education、contact_info、posts、company、followers推荐列表
接入方式:
  - Docker 容器内运行，挂载 ~/.linkedin-mcp/ 目录
  - 后端通过 HTTP MCP 协议调用，端口 8080
风险控制:
  - 每日调用量需人工设定上限（无内置限速）
  - 触达操作（发消息）必须 100% 进入审批，不可绕过
```

**XActions（Twitter/X 首选）**
```
GitHub: nirholas/XActions
特点:
  - 无需 Twitter API Key，无月费，完全开源
  - 支持: 搜推文、搜用户、获取粉丝列表、获取互动用户
  - MCP Server + CLI + 浏览器扩展三合一
  - 数据不出本地，session cookie 管理
接入方式:
  - Docker 运行 MCP Server: docker run -p 3000:3000 xactions npm run mcp
  - 后端通过 HTTP MCP 协议调用
备选: rafaljanicki/x-twitter-mcp-server（官方 API，需付费）
```

**Apify MCP（Reddit/Instagram/TikTok/Web 统一入口）**
```
MCP URL: https://mcp.apify.com
认证:    Authorization: Bearer <APIFY_TOKEN>
关键 Actor:
  - harshmaur/reddit-scraper          → Reddit 帖子/用户/社区
  - scrapio/reddit-lead-scraper        → Reddit 意向用户提取
  - apify/instagram-scraper            → Instagram 帖子/评论/用户
  - clockworks/tiktok-scraper          → TikTok 视频/评论/用户
  - compass/google-maps-scraper        → Google Maps 商户信息
  - apify/web-scraper                  → 通用网页抓取
  - apify/local-lead-generation-agent  → Instagram AI评分获客（自带 LLM 打分）
特点:
  - 统一通过 Apify MCP 协议调用，无需为每个平台单独维护爬虫
  - 按量付费，无固定月费（约 $0.15-$0.40/千条数据）
  - 自动处理反爬、IP 轮换、验证码
```

---

## 3. 数据模型（Prisma Schema 扩展）

在主 Schema 基础上追加以下表：

```prisma
// ─── 获客任务 ──────────────────────────────────────────

// 一个"搜索任务"对应一次抓取配置
model ProspectTask {
  id              String            @id @default(cuid())
  teamId          String
  name            String            // 任务名称，如"TikTok竞品#跨境电商评论者"
  platform        ProspectPlatform
  searchConfig    Json              // 平台特定搜索参数（关键词/hashtag/竞品账号）
  status          TaskStatus        @default(IDLE)
  schedule        String?           // cron 表达式，null 代表手动执行
  lastRunAt       DateTime?
  totalFound      Int               @default(0)
  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  prospects       Prospect[]
  runs            ProspectTaskRun[]
}

enum ProspectPlatform {
  LINKEDIN TWITTER REDDIT INSTAGRAM TIKTOK
  XIAOHONGSHU DOUYIN GOOGLE_MAPS WEB_GENERAL
}

enum TaskStatus {
  IDLE RUNNING PAUSED COMPLETED FAILED
}

// 任务每次执行记录
model ProspectTaskRun {
  id             String          @id @default(cuid())
  taskId         String
  status         RunStatus
  foundCount     Int             @default(0)
  newCount       Int             @default(0)     // 本次新增（去重后）
  errorMessage   String?
  rawDataUrl     String?                         // 原始数据 S3 路径（备查）
  latencyMs      Int?
  createdAt      DateTime        @default(now())
  task           ProspectTask    @relation(fields: [taskId], references: [id])
}

// ─── 潜在客户库 ────────────────────────────────────────

model Prospect {
  id                String             @id @default(cuid())
  teamId            String
  taskId            String
  platform          ProspectPlatform
  platformUserId    String             // 平台内唯一标识
  username          String
  displayName       String?
  profileUrl        String?
  bio               String?
  followers         Int?
  following         Int?
  postCount         Int?
  engagementRate    Float?
  location          String?
  contactInfo       Json?              // email, website, phone（从 profile 提取）
  rawData           Json               // 完整原始数据快照
  intentScore       Float?             // 0-100, AI 意向分
  intentLabel       IntentLabel?       // 高/中/低意向分类
  intentReason      String?            // AI 打分理由
  tags              String[]           // 人工标签
  status            ProspectStatus     @default(NEW)
  isDuplicate       Boolean            @default(false)
  duplicateOfId     String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  task              ProspectTask       @relation(fields: [taskId], references: [id])
  outreachMessages  OutreachMessage[]

  @@unique([teamId, platform, platformUserId])  // 去重主键
  @@index([teamId, intentScore])
  @@index([teamId, platform, status])
}

enum IntentLabel {
  HIGH    // 分值 >= 70
  MEDIUM  // 分值 40-69
  LOW     // 分值 < 40
}

enum ProspectStatus {
  NEW           // 新抓取，未评分
  SCORED        // 已评分
  QUEUED        // 已加入触达队列
  CONTACTED     // 已发送
  REPLIED       // 对方已回复
  CONVERTED     // 已转化
  EXCLUDED      // 手动排除/拉黑
}

// ─── 触达活动 ──────────────────────────────────────────

// 一个"触达活动"包含一批 prospect + 一套消息模板
model OutreachCampaign {
  id              String             @id @default(cuid())
  teamId          String
  name            String
  platform        ProspectPlatform
  messageTemplate String             // Jinja2/Handlebars 模板，支持 {{name}} 等变量
  targetCount     Int                @default(0)
  sentCount       Int                @default(0)
  replyCount      Int                @default(0)
  status          CampaignStatus     @default(DRAFT)
  dailyLimit      Int                @default(20)   // 每日最大发送数
  createdBy       String
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  messages        OutreachMessage[]
}

enum CampaignStatus {
  DRAFT ACTIVE PAUSED COMPLETED ARCHIVED
}

// 每条私信的完整生命周期
model OutreachMessage {
  id              String            @id @default(cuid())
  teamId          String
  campaignId      String
  prospectId      String
  content         String            // AI 生成的最终消息内容
  status          MessageStatus     @default(DRAFT)
  approvalId      String?           // 关联 approval_requests
  idempotencyKey  String            @unique
  sentAt          DateTime?
  readAt          DateTime?
  repliedAt       String?
  errorMessage    String?
  createdAt       DateTime          @default(now())
  campaign        OutreachCampaign  @relation(fields: [campaignId], references: [id])
  prospect        Prospect          @relation(fields: [prospectId], references: [id])
}

enum MessageStatus {
  DRAFT           // AI 生成草稿
  PENDING_APPROVAL// 等待审批
  APPROVED        // 审批通过
  QUEUED          // 已入队
  SENT            // 已发送
  FAILED          // 发送失败
  EXCLUDED        // 被人工剔除
}
```

---

## 4. Action Flow：获客专用动作流

### 4.1 抓取流（低风险，无需审批）

```
用户配置 ProspectTask（平台 + 关键词 + 抓取上限）
  → POST /api/acquisition/tasks/:id/run
  → ProspectTaskService.run()
    → 写入 ProspectTaskRun (status=RUNNING)
    → BullMQ: 推入 acquisition.scrape 队列
    → [Worker] 调用对应平台连接器 (scrapeProspects)
      → LinkedIn MCP: search_people + get_person_profile
      → Apify MCP: call_actor (reddit-scraper / instagram-scraper)
      → XActions MCP: searchTweets + scrapeProfile
    → 结果批量写入 prospects 表（去重：platformUserId + teamId）
    → 更新 ProspectTaskRun (status=SUCCEEDED, foundCount, newCount)
    → BullMQ: 推入 acquisition.score 队列（批量评分）
```

### 4.2 评分流（AI 自动，无需审批）

```
[Worker] acquisition.score 消费
  → 批量读取 status=NEW 的 prospects
  → 构建评分 Prompt（见第8节）
  → 调用 Anthropic API，获取 intentScore + intentLabel + intentReason
  → 批量更新 prospects (status=SCORED)
  → 分值 >= 团队阈值 → 推荐加入触达队列（前端显示提示，不自动加）
```

### 4.3 触达流（高风险，必须审批）

```
用户选择 prospects → 创建/选择 OutreachCampaign → 触发批量生成草稿
  → POST /api/acquisition/campaigns/:id/generate-messages
    → 对每个 prospect 调用 AI 生成个性化消息
    → 批量创建 OutreachMessage (status=DRAFT)
    → 整批创建一个 ApprovalRequest (actionType="outreach.send_batch")
      payloadSnapshot 包含: campaignId + 所有 messageId + 目标平台 + 发送数量
  → 审批者在"审批"页面预览每条消息 → 通过/驳回
  → 审批通过后:
    → BullMQ: 推入 acquisition.send 队列（按 dailyLimit 限速）
    → [Worker] 调用平台连接器发送私信
    → 更新 OutreachMessage (status=SENT/FAILED)
    → 写入 audit_logs
```

---

## 5. 连接器层设计

### 5.1 获客专用 Scrape 接口

```typescript
// packages/connectors/src/base/acquisition-connector.interface.ts

export interface ProspectSearchParams {
  keyword?: string;
  hashtags?: string[];
  competitorUsername?: string;   // 抓取竞品账号的互动用户
  subreddit?: string;            // Reddit 专用
  location?: string;
  maxResults: number;            // 强制设上限
  minFollowers?: number;
  minEngagementRate?: number;
}

export interface RawProspect {
  platformUserId: string;
  username: string;
  displayName?: string;
  profileUrl: string;
  bio?: string;
  followers?: number;
  following?: number;
  postCount?: number;
  engagementRate?: number;
  location?: string;
  contactInfo?: { email?: string; website?: string };
  rawData: Record<string, unknown>;
}

export interface AcquisitionConnector {
  readonly platform: ProspectPlatform;
  searchProspects(params: ProspectSearchParams): Promise<RawProspect[]>;
  sendMessage(
    recipientId: string,
    content: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; platformMsgId?: string; error?: string }>;
}
```

### 5.2 LinkedIn 连接器实现

```typescript
// packages/connectors/src/linkedin/linkedin-acquisition.connector.ts

@Injectable()
export class LinkedInAcquisitionConnector implements AcquisitionConnector {
  readonly platform = ProspectPlatform.LINKEDIN;

  // LinkedIn MCP Server 地址 (本地 Docker)
  private readonly MCP_URL = 'http://localhost:8080/mcp';

  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly auditService: AuditService,
  ) {}

  async searchProspects(params: ProspectSearchParams): Promise<RawProspect[]> {
    // 1. 限速：LinkedIn 每小时上限 50 次 profile 查询
    await this.rateLimiter.consume('linkedin', 'search', 50, 3600);

    // 2. 调用 LinkedIn MCP: search_people
    const searchResult = await this.callMcp('search_people', {
      keywords: params.keyword,
      limit: Math.min(params.maxResults, 50), // 强制上限 50
    });

    // 3. 对每个结果调用 get_person_profile 补充详情
    const profiles = await Promise.allSettled(
      searchResult.results.slice(0, params.maxResults).map((r) =>
        this.callMcp('get_person_profile', {
          profile_url: r.profileUrl,
          sections: ['contact_info', 'about', 'experience'],
        })
      )
    );

    return profiles
      .filter((p) => p.status === 'fulfilled')
      .map((p) => this.normalizeLinkedInProfile((p as PromiseFulfilledResult<any>).value));
  }

  async sendMessage(
    recipientId: string,
    content: string,
    idempotencyKey: string,
  ): Promise<{ success: boolean; platformMsgId?: string; error?: string }> {
    // 限速：LinkedIn 每日发消息上限 20 条（严格限制）
    await this.rateLimiter.consume('linkedin', 'send_message', 20, 86400);

    try {
      const result = await this.callMcp('send_message', {
        recipient_profile_url: recipientId,
        message: content,
      });
      return { success: true, platformMsgId: result.messageId };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  private async callMcp(tool: string, params: object): Promise<any> {
    // HTTP MCP 调用 linkedin-mcp-server
    const response = await fetch(`${this.MCP_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: randomUUID(), method: 'tools/call',
        params: { name: tool, arguments: params },
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return JSON.parse(data.result.content[0].text);
  }

  private normalizeLinkedInProfile(raw: any): RawProspect {
    return {
      platformUserId: raw.profileUrl,
      username: raw.publicIdentifier ?? raw.name,
      displayName: raw.name,
      profileUrl: raw.profileUrl,
      bio: raw.about,
      followers: raw.followersCount,
      location: raw.location,
      contactInfo: { email: raw.contactInfo?.email, website: raw.contactInfo?.website },
      rawData: raw,
    };
  }
}
```

### 5.3 Apify 统一连接器（Reddit/Instagram/TikTok/Web）

```typescript
// packages/connectors/src/apify/apify-acquisition.connector.ts

const APIFY_ACTORS: Record<ProspectPlatform, string> = {
  [ProspectPlatform.REDDIT]:    'harshmaur/reddit-scraper',
  [ProspectPlatform.INSTAGRAM]: 'apify/instagram-scraper',
  [ProspectPlatform.TIKTOK]:    'clockworks/tiktok-scraper',
  [ProspectPlatform.WEB_GENERAL]: 'apify/web-scraper',
  // ...
};

@Injectable()
export class ApifyAcquisitionConnector implements AcquisitionConnector {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async searchProspects(params: ProspectSearchParams): Promise<RawProspect[]> {
    const actorId = APIFY_ACTORS[this.platform];
    const token = this.configService.get('APIFY_TOKEN');

    // 调用 Apify REST API 启动 Actor Run
    const runRes = await this.httpService.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      this.buildActorInput(params),
      { headers: { Authorization: `Bearer ${token}` } }
    ).toPromise();

    // 轮询等待完成（最多 5 分钟）
    const datasetId = await this.pollUntilComplete(runRes.data.id, token);

    // 获取数据集
    const items = await this.fetchDataset(datasetId, token);
    return items.map((item) => this.normalizeApifyItem(item));
  }

  // sendMessage 仅对支持发消息的平台实现，Instagram/Reddit DM 通过 Playwright 发
  async sendMessage(...) { /* 调用对应平台 Playwright Worker */ }
}
```

### 5.4 XActions 连接器（Twitter/X）

```typescript
// packages/connectors/src/twitter/twitter-acquisition.connector.ts

@Injectable()
export class TwitterAcquisitionConnector implements AcquisitionConnector {
  readonly platform = ProspectPlatform.TWITTER;
  private readonly MCP_URL = 'http://localhost:3000'; // XActions MCP Server

  async searchProspects(params: ProspectSearchParams): Promise<RawProspect[]> {
    // 搜索相关推文
    const tweets = await this.callXActions('searchTweets', {
      query: params.keyword ?? params.hashtags?.map(h => `#${h}`).join(' OR '),
      limit: params.maxResults,
      minLikes: 10, // 过滤低互动推文
    });

    // 提取推文作者，去重
    const uniqueUsers = [...new Map(
      tweets.map((t: any) => [t.author.id, t.author])
    ).values()].slice(0, params.maxResults);

    // 批量获取用户详情
    const profiles = await Promise.all(
      uniqueUsers.map((u: any) =>
        this.callXActions('scrapeProfile', { username: u.username })
      )
    );

    return profiles.map((p: any) => ({
      platformUserId: p.id,
      username: p.username,
      displayName: p.displayName,
      profileUrl: `https://x.com/${p.username}`,
      bio: p.bio,
      followers: p.followersCount,
      following: p.followingCount,
      location: p.location,
      rawData: p,
    }));
  }

  async sendMessage(recipientId: string, content: string) {
    // Twitter DM 发送（通过 XActions MCP）
    // 注意：每日 DM 上限极低，需严格限速
    return this.callXActions('sendDirectMessage', {
      username: recipientId, message: content,
    });
  }

  private async callXActions(tool: string, params: object) {
    // 调用 XActions MCP Server
  }
}
```

---

## 6. API 端点

```
# ─── 获客任务 ────────────────────────────────────────────────
GET    /api/acquisition/tasks                  ?platform&status&page
POST   /api/acquisition/tasks                  创建新抓取任务
GET    /api/acquisition/tasks/:id
PATCH  /api/acquisition/tasks/:id              修改配置/调整schedule
DELETE /api/acquisition/tasks/:id
POST   /api/acquisition/tasks/:id/run          立即执行（写入BullMQ）
POST   /api/acquisition/tasks/:id/pause
GET    /api/acquisition/tasks/:id/runs         执行历史记录

# ─── 潜客库 ──────────────────────────────────────────────────
GET    /api/acquisition/prospects              ?platform&intentLabel&status&taskId&page
GET    /api/acquisition/prospects/:id
PATCH  /api/acquisition/prospects/:id          更新 tags / status
POST   /api/acquisition/prospects/:id/exclude  手动排除
POST   /api/acquisition/prospects/:id/rescore  重新 AI 评分
POST   /api/acquisition/prospects/bulk-score   批量触发评分（指定 taskId 或 ids[]）
GET    /api/acquisition/prospects/export       导出 CSV（需审批，防止数据泄露）

# ─── 触达活动 ─────────────────────────────────────────────────
GET    /api/acquisition/campaigns              ?status&platform
POST   /api/acquisition/campaigns              创建新活动
GET    /api/acquisition/campaigns/:id
PATCH  /api/acquisition/campaigns/:id
DELETE /api/acquisition/campaigns/:id
POST   /api/acquisition/campaigns/:id/generate-messages   AI批量生成草稿 [Idempotency-Key]
POST   /api/acquisition/campaigns/:id/submit-for-approval  整批提交审批
POST   /api/acquisition/campaigns/:id/pause
POST   /api/acquisition/campaigns/:id/resume

# ─── 私信消息 ─────────────────────────────────────────────────
GET    /api/acquisition/messages               ?campaignId&status&page
GET    /api/acquisition/messages/:id
PATCH  /api/acquisition/messages/:id           修改草稿内容
DELETE /api/acquisition/messages/:id           从批次移除

# ─── 统计看板 ─────────────────────────────────────────────────
GET    /api/acquisition/stats                  总览数据（各平台prospects数、触达率、回复率）
GET    /api/acquisition/stats/funnel           漏斗图数据（发现→评分→触达→回复→转化）
```

---

## 7. 前端模块设计

### 7.1 页面与组件映射

#### `/acquisition/board` — 任务看板

```
ProspectBoard
  ├── AcquisitionStats         # 顶部指标卡：总潜客/高意向/待触达/本月回复率
  ├── PlatformHealthBar        # 各平台账号状态（LinkedIn/X 登录态提示）
  ├── ProspectTaskList         # 任务列表：平台、状态、上次执行、找到数
  │   └── TaskRunModal         # 点击任务查看历史执行记录
  └── QuickActions             # 新建任务、立即抓取快捷按钮
```

#### `/acquisition/search` — 潜客搜索（新建任务）

```
ProspectSearchConfig
  ├── PlatformSelector         # 平台 Tab（LinkedIn / Twitter / Reddit / ...）
  ├── SearchForm               # 平台特定搜索参数
  │   ├── KeywordInput
  │   ├── HashtagInput
  │   ├── CompetitorAccountInput  # 抓竞品账号互动用户
  │   ├── MaxResultsSlider        # 50 / 100 / 200 / 500（风险随数量升高）
  │   └── FilterPanel             # 最低粉丝数/最低互动率
  ├── RiskWarningBanner        # 平台风险提示（LinkedIn高风险时显示红色警告）
  └── PreviewEstimate          # 预估找到人数 + 预估耗时 + 预估 Apify 费用
```

#### `/acquisition/prospects` — 潜客库

```
ProspectLibrary
  ├── FilterBar                # 平台/意向标签/状态/任务/时间范围
  ├── ProspectTable            # TanStack Table，支持列排序
  │   列: 头像+姓名、平台、意向分(进度条)、粉丝数、状态、标签、操作
  │   行操作: 查看详情、加入活动、排除、重新评分
  ├── ProspectDetailDrawer     # 右侧抽屉：完整 profile + AI 评分理由 + 历史触达记录
  └── BulkActions              # 批量：加入活动、排除、导出
```

**意向分视觉设计：**

```
IntentScoreBadge:
  >= 70  → 🟢 绿色进度条 "高意向"
  40-69  → 🟡 黄色进度条 "中意向"
  < 40   → 🔴 红色进度条 "低意向"
  null   → ⚪ 灰色 "待评分"
```

#### `/acquisition/outreach` — 触达管理

```
OutreachManager
  ├── CampaignList             # 活动列表：名称、平台、状态、进度(sent/total)
  ├── CampaignCreateModal      # 新建活动：选平台、输入消息模板、设置日发送上限
  └── CampaignDetail           # 活动详情页
      ├── MessageTemplateEditor    # 编辑模板，支持 {{name}} {{platform}} 变量
      ├── ProspectSelector         # 从潜客库筛选添加到本活动
      ├── GenerateDraftsButton     # AI批量生成个性化草稿
      ├── MessagePreviewList       # 预览所有草稿，可单条编辑/删除
      ├── SubmitApprovalButton     # 整批提交审批（显示总人数+平台风险等级）
      └── SendProgressBar          # 审批通过后的发送进度
```

#### `/acquisition/calendar` — 触达日历

```
OutreachCalendar
  ├── CalendarView             # 月/周视图，显示每日计划发送数（按 dailyLimit 渲染）
  ├── DailyLimitWarning        # 接近平台安全阈值时显示警告
  └── ScheduleConflictAlert    # 多个活动同日发送时的冲突提示
```

### 7.2 关键 UI 规范

**平台安全等级视觉分级：**

每个平台都有固定的安全等级徽章，在新建任务时显示：

```
LinkedIn   🔴 高风险 — 建议每日搜索 ≤50，发消息 ≤20
Twitter/X  🟡 中风险 — 建议每日搜索 ≤200，发DM ≤50
Reddit     🟢 低风险 — 通过 Apify 抓取，无账号风险
Instagram  🟡 中风险 — 抓取低风险，发DM 需谨慎
小红书     🔴 高风险 — 依赖浏览器自动化，账号稳定性差
抖音       🔴 高风险 — 同上
```

**审批提交时的风险确认 Dialog：**

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  即将提交触达审批                                │
│                                                     │
│  平台:    LinkedIn        风险等级: 🔴 高风险       │
│  发送数:  45 条消息                                 │
│  账号:    品牌 LinkedIn 主账号                      │
│  每日上限: 20 条（预计 3 天发完）                   │
│                                                     │
│  ⚠️ LinkedIn 对批量消息非常敏感，超限可能导致账号   │
│     受限或临时封禁。请确保消息内容真实、个性化。    │
│                                                     │
│  幂等键: [自动生成]                                │
│                                                     │
│              [取消]  [我已了解风险，提交审批]       │
└─────────────────────────────────────────────────────┘
```

---

## 8. AI 意向评分引擎

### 8.1 评分 Prompt 模板

```typescript
// packages/ai-agents/src/prospect-scoring/scoring.prompt.ts

export function buildScoringPrompt(
  prospect: RawProspect,
  businessContext: string,  // 团队业务描述
  targetCustomerProfile: string  // 理想客户画像
): string {
  return `
你是一个跨境电商获客专家。请对以下社媒用户进行意向评分。

## 我们的业务
${businessContext}

## 理想客户画像
${targetCustomerProfile}

## 待评分用户信息
平台: ${prospect.platform}
用户名: ${prospect.username}
简介: ${prospect.bio ?? '无'}
粉丝数: ${prospect.followers ?? '未知'}
发帖数: ${prospect.postCount ?? '未知'}
互动率: ${prospect.engagementRate ? (prospect.engagementRate * 100).toFixed(1) + '%' : '未知'}
地区: ${prospect.location ?? '未知'}
联系信息: ${JSON.stringify(prospect.contactInfo ?? {})}

## 最近内容摘要（如有）
${JSON.stringify(prospect.rawData?.recentPosts ?? prospect.rawData?.recentTweets ?? '无').slice(0, 500)}

## 评分任务
请综合分析该用户是否符合我们的目标客户画像，输出以下 JSON（不要包含任何其他内容）：

{
  "intentScore": <0-100 的整数>,
  "intentLabel": <"HIGH" | "MEDIUM" | "LOW">,
  "intentReason": "<2-3句话说明打分依据，包含关键信号>",
  "redFlags": ["<可能的负面信号，如账号不活跃、业务不匹配>"],
  "suggestedAngle": "<触达时建议的切入角度，1句话>"
}
`.trim();
}
```

### 8.2 批量评分 Worker

```typescript
// apps/worker/src/processors/prospect-scoring.processor.ts

@Processor(QUEUES.ACQUISITION_SCORE)
export class ProspectScoringProcessor {
  @Process()
  async handle(job: Job<{ taskId: string; teamId: string }>) {
    const { taskId, teamId } = job.data;

    // 批量读取待评分 prospects（每批 20 条）
    const prospects = await this.prisma.prospect.findMany({
      where: { taskId, status: 'NEW', teamId },
      take: 20,
    });

    if (!prospects.length) return;

    // 获取团队业务上下文
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    const businessContext = team.acquisitionContext ?? '跨境电商卖家，销售3C电子产品和家居用品';
    const targetProfile = team.targetCustomerProfile ?? '对跨境购物感兴趣的消费者或中小型电商卖家';

    // 并发评分（限制 3 个并发，避免 API 过载）
    await pLimit(3)(
      prospects.map((p) => async () => {
        try {
          const prompt = buildScoringPrompt(p.rawData as RawProspect, businessContext, targetProfile);
          const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
          });

          const result = JSON.parse(response.content[0].text);

          await this.prisma.prospect.update({
            where: { id: p.id },
            data: {
              intentScore: result.intentScore,
              intentLabel: result.intentLabel,
              intentReason: result.intentReason,
              rawData: { ...p.rawData, aiAnalysis: result },
              status: 'SCORED',
            },
          });
        } catch (e) {
          // 单条失败不中断整批
          console.error(`Scoring failed for prospect ${p.id}:`, e.message);
        }
      })
    );

    // 如果还有未评分的，继续推入队列
    const remaining = await this.prisma.prospect.count({
      where: { taskId, status: 'NEW', teamId },
    });
    if (remaining > 0) {
      await this.scoringQueue.add({ taskId, teamId }, { delay: 2000 });
    }
  }
}
```

### 8.3 AI 消息个性化生成

```typescript
// packages/ai-agents/src/outreach/message-generator.ts

export function buildMessageGenerationPrompt(
  prospect: Prospect,
  template: string,
  platform: ProspectPlatform,
): string {
  return `
你是一个跨境电商品牌的运营专员，请根据以下用户信息，将消息模板个性化改写。

## 用户信息
姓名/昵称: ${prospect.displayName ?? prospect.username}
平台: ${platform}
简介: ${prospect.bio ?? '无'}
意向评分: ${prospect.intentScore}/100
评分理由: ${prospect.intentReason ?? '无'}
AI 建议切入角度: ${(prospect.rawData as any)?.aiAnalysis?.suggestedAngle ?? '无'}

## 消息模板
${template}

## 要求
- 将 {{name}} 替换为该用户的称呼
- 根据用户简介和切入角度，在模板基础上增加1句个性化内容
- 语气自然、真诚，不要像群发广告
- 针对 ${platform} 平台的语言风格调整
- 控制在 150 字以内
- 只输出最终消息内容，不要任何说明

最终消息:
`.trim();
}
```

---

## 9. 安全与风控标准

### 9.1 平台限速配置表

在 `risk_rules` 表中预置以下规则（团队可覆盖）：

| 平台 | 动作 | 每小时上限 | 每日上限 | 风险等级 | 强制审批 |
|------|------|-----------|----------|----------|----------|
| LinkedIn | scrape_profile | 50 | 200 | HIGH | 否（抓取） |
| LinkedIn | send_message | 5 | 20 | HIGH | **是** |
| Twitter/X | search_tweets | 200 | 1000 | MEDIUM | 否 |
| Twitter/X | send_dm | 20 | 50 | HIGH | **是** |
| Reddit | scrape | 不限 | 不限 | LOW | 否 |
| Reddit | send_dm | 10 | 30 | MEDIUM | **是** |
| Instagram | scrape | 100 | 500 | MEDIUM | 否 |
| Instagram | send_dm | 10 | 30 | HIGH | **是** |
| 小红书 | scrape | 50 | 200 | HIGH | 否 |
| 小红书 | send_message | 5 | 15 | HIGH | **是** |

### 9.2 强制规则（代码级，不可配置覆盖）

```typescript
// 获客模块专用的高风险动作，在 AcquisitionService 中强制校验
export const ACQUISITION_ALWAYS_REQUIRE_APPROVAL = new Set([
  'outreach.send_batch',    // 批量发私信
  'outreach.send_single',   // 单条发私信
  'prospect.bulk_export',   // 批量导出潜客数据（防数据泄露）
]);

// 每日发送总量硬上限（即使审批通过也不超过）
export const PLATFORM_HARD_LIMITS = {
  LINKEDIN:    { send_message: 20 },
  TWITTER:     { send_dm: 50 },
  INSTAGRAM:   { send_dm: 30 },
  REDDIT:      { send_dm: 30 },
  XIAOHONGSHU: { send_message: 15 },
  DOUYIN:      { send_message: 15 },
};
```

### 9.3 数据合规要求

- **原始数据加密归档**：所有抓取到的 rawData 中包含的联系方式（email/phone）字段，在数据库写入前经过 AES-256 加密。
- **数据保留策略**：status=EXCLUDED 的 prospects 数据 90 天后自动软删除。
- **导出审批**：批量导出 >100 条 prospects 必须进入审批，导出日志写入 audit_logs。
- **发送前二次去重**：发送 Worker 在执行前检查 `OutreachMessage` 中该 prospectId 是否已有 `status=SENT` 记录，防止重复触达。

---

## 10. 里程碑任务分解

### MA0：数据模型与 Worker 骨架（2 天）

| 任务 | 完成标准 |
|------|----------|
| Prisma 迁移：新增获客相关 5 张表 | `pnpm prisma migrate dev` 成功 |
| BullMQ 注册 3 个新队列 (acquisition.scrape / .score / .send) | 队列可消费 |
| AcquisitionModule + Controller + Service 骨架 | `/api/acquisition/tasks` 返回 200 |
| 平台限速 RateLimiterService 实现 | 单测覆盖超限场景 |
| 5 张新表的硬上限规则写入 `risk_rules` 种子数据 | seed 执行成功 |

### MA1：Apify 连接器（Reddit/Instagram/TikTok）（3 天）

| 任务 | 完成标准 |
|------|----------|
| ApifyAcquisitionConnector 实现（searchProspects） | Reddit 真实数据可抓取入库 |
| ProspectTaskRun 写入与状态更新 | 执行记录完整 |
| 去重逻辑（platformUserId + teamId 唯一键） | 重复运行不产生重复数据 |
| ProspectScoringProcessor 基础实现 | NEW→SCORED 流转成功 |
| 前端：任务看板 + 潜客库（Mock + 真实数据切换）| 表格可渲染真实评分结果 |

### MA2：LinkedIn + Twitter 连接器（5 天）

| 任务 | 完成标准 |
|------|----------|
| LinkedIn MCP Server 容器化部署（Docker Compose）| 本地可访问 :8080/mcp |
| LinkedInAcquisitionConnector.searchProspects | LinkedIn 人员搜索真实数据入库 |
| XActions Docker 部署 + TwitterAcquisitionConnector | Twitter 搜推文 → 提取用户 入库 |
| 小红书 Playwright 获客连接器（基于已有媒体 Worker）| 获取笔记评论用户 |
| 每日限速 RateLimiter 在真实调用中有效 | 超限返回 PLATFORM_RATE_LIMITED |

### MA3：AI 意向评分（2 天）

| 任务 | 完成标准 |
|------|----------|
| ProspectScoringProcessor 接入 Anthropic API | 评分结果写入 intentScore/intentLabel/intentReason |
| 批量处理（pLimit 并发控制）| 100 条数据 ≤ 3 分钟完成 |
| 团队级 businessContext + targetCustomerProfile 配置 | 在系统设置中可编辑 |
| 前端：IntentScoreBadge + ProspectDetailDrawer AI 评分展示 | 评分理由 UI 清晰展示 |

### MA4：触达活动与审批整合（4 天）

| 任务 | 完成标准 |
|------|----------|
| AI 个性化消息生成 (generateMessages) | 50 条消息 ≤ 2 分钟生成完毕 |
| OutreachCampaign → ApprovalRequest 整合 | 提交审批 → 审批队列出现 |
| acquisition.send Worker（限速发送） | 按 dailyLimit 发送，超限自动排期 |
| LinkedIn/Twitter/Instagram 发消息连接器 | 测试账号真实发送 1 条成功 |
| 幂等键防重复发送校验 | 相同 idempotencyKey 不重复执行 |
| 触达日历前端渲染 | 每日发送量可视化 |
| 审批页面扩展：支持预览 outreach 批次 | 审批者能逐条查看草稿 |

### MA5：风控完善与数据导出（2 天）

| 任务 | 完成标准 |
|------|----------|
| 平台硬上限熔断（超过 PLATFORM_HARD_LIMITS 自动暂停） | 单测覆盖 |
| 批量导出审批流程 | 导出 >100 条触发审批 |
| 原始联系方式字段加密入库 | 数据库无明文 email/phone |
| 获客模块 E2E 测试（搜索→评分→生成草稿→审批→发送模拟）| Playwright 测试通过 |
| 获客漏斗统计 API + 前端图表 | 数据与数据库一致 |

---

## 附录：searchConfig JSON Schema（各平台）

```typescript
// packages/shared/src/schemas/acquisition-search-config.schema.ts

const LinkedInSearchConfig = z.object({
  keywords:          z.string(),
  titleFilter:       z.string().optional(),    // 职位过滤
  companyFilter:     z.string().optional(),    // 公司过滤
  locationFilter:    z.string().optional(),
  maxResults:        z.number().int().min(1).max(200),
});

const TwitterSearchConfig = z.object({
  keywords:          z.string().optional(),
  hashtags:          z.array(z.string()).optional(),
  competitorAccount: z.string().optional(),    // 抓竞品账号的互动用户
  minLikes:          z.number().int().default(10),
  maxResults:        z.number().int().min(1).max(500),
  since:             z.string().datetime().optional(),
});

const RedditSearchConfig = z.object({
  keywords:          z.string().optional(),
  subreddits:        z.array(z.string()).optional(),
  postType:          z.enum(['post', 'comment', 'both']).default('both'),
  minKarma:          z.number().int().default(100),
  maxResults:        z.number().int().min(1).max(500),
});

const InstagramSearchConfig = z.object({
  hashtags:          z.array(z.string()).optional(),
  competitorAccount: z.string().optional(),
  contentType:       z.enum(['post', 'reel', 'story']).default('post'),
  minFollowers:      z.number().int().default(1000),
  maxResults:        z.number().int().min(1).max(300),
});

export const SearchConfigSchema = z.discriminatedUnion('platform', [
  z.object({ platform: z.literal('LINKEDIN'), config: LinkedInSearchConfig }),
  z.object({ platform: z.literal('TWITTER'), config: TwitterSearchConfig }),
  z.object({ platform: z.literal('REDDIT'), config: RedditSearchConfig }),
  z.object({ platform: z.literal('INSTAGRAM'), config: InstagramSearchConfig }),
  // ...其他平台
]);
```

---

*本模块文档为获客功能开发的权威参考，所有平台限速参数的调整需记录于 `docs/adr/` 中，并更新 `risk_rules` 种子数据。*