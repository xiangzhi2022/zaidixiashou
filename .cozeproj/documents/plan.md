# AI Commerce Ops Dashboard — 完整重构开发方案 (v2)

## 概述

跨境电商 AI 运营中控台完整重构。核心架构：以 Chrome DevTools Protocol (CDP) 为首选方案，用户连接自己的 Chrome 浏览器实现免授权平台操作和账号配置辅助；新增 SaaS 订阅付费体系（微信支付 + 支付宝），平台提供基础 AI API 额度，用户也可自带 API Key；新增登录页（微信扫码 + 短信验证码）；新增获客一级功能区；新增 AI 模型接入设置；新增订阅与账单管理；补全全部页面交互逻辑。平台：Web。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 前端框架 | React 19 + Vite (已有) | 项目已初始化 |
| UI 组件 | shadcn/ui + Tailwind v4 | 与设计引导工具一致 |
| 后端框架 | NestJS (已有) | 沿用，新增认证/支付/CDP 模块 |
| 浏览器自动化 | Chrome DevTools Protocol via puppeteer-core | 用户本地 Chrome，复用已登录会话，免平台 API 授权 |
| 认证 | JWT + 微信 OAuth2.0 + 短信验证码 | 三种登录方式 |
| 支付 | 微信支付 Native + 支付宝当面付 | SaaS 订阅付费 |
| 数据库 | PostgreSQL + Prisma (已有) | 沿用，新增认证/支付/获客相关表 |
| 任务队列 | BullMQ + Redis (已有) | 沿用 |
| AI 模型接入 | 用户自带 Key 或平台 API 额度 | 双模式，免费版自带 Key 限额，付费版享平台额度 |
| 短信服务 | 阿里云短信 / 腾讯云短信 | 短信验证码登录 |
| 对象存储 | S3 兼容 (MinIO/Supabase) | 支付凭证、截图存储 |

## 功能模块

### 一、认证与登录模块 (新增)

登录页为整个系统的入口，未登录用户统一跳转至此。

**登录方式**：
- **微信扫码登录**：展示微信 OAuth 二维码，用户扫码授权后获取 openid → 查找/创建用户 → 签发 JWT
- **短信验证码登录**：输入手机号 → 发送验证码 → 验证通过 → 查找/创建用户 → 签发 JWT
- 两种方式可互绑：微信登录后可绑定手机号，手机号登录后可绑定微信

**数据结构**：
```prisma
model User {
  id             String    @id @default(cuid())
  phone          String?   @unique
  wechatOpenid   String?   @unique
  wechatUnionid  String?   @unique
  wechatNickname String?
  wechatAvatar   String?
  name           String?
  email          String?
  passwordHash   String?
  avatar         String?
  role           UserRole  @default(OPERATOR)
  status         UserStatus @default(ACTIVE)
  lastLoginAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  memberships    TeamMember[]
  apiKeys        UserApiKey[]
  subscriptions  Subscription[]
  auditLogs      AuditLog[]
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

model SmsCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  used      Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

### 二、SaaS 订阅与支付模块 (新增)

SaaS 运营工具模式，用户付费订阅解锁功能和 AI API 额度。

**套餐体系**：
| 套餐 | 月价 | 年价 | AI 额度 | CDP 并发 | 获客任务 |
|------|------|------|---------|---------|---------|
| 免费版 | ¥0 | ¥0 | 自带 Key 限额 50次/天 | 1 连接 | 1 任务/月 |
| 基础版 | ¥99 | ¥999 | 平台 API 500次/天 | 2 连接 | 10 任务/月 |
| 专业版 | ¥299 | ¥2,999 | 平台 API 2,000次/天 | 5 连接 | 不限 |
| 企业版 | ¥799 | ¥7,999 | 平台 API 不限 | 不限 | 不限 |

**支付方式**：
- 微信支付 Native（扫码支付）— 生成支付二维码，前端轮询支付状态
- 支付宝当面付（扫码支付）— 同上

**CDP 帮助功能**：在平台账号管理页面，提供 CDP 辅助配置向导：
1. 一键检测本地 Chrome 调试端口
2. 自动生成启动命令（区分 macOS/Windows/Linux）
3. 连接后自动检测已登录平台（通过 CDP 读取 Cookie/页面状态）
4. 引导用户在 Chrome 中登录未登录的平台

**数据结构**：
```prisma
model Subscription {
  id            String          @id @default(cuid())
  userId        String
  plan          SubscriptionPlan @default(FREE)
  status        SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  aiQuotaUsed   Int             @default(0)
  aiQuotaLimit  Int             @default(50)
  cdpConnections Int            @default(1)
  acquisitionTasks Int          @default(1)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  user          User            @relation(fields: [userId], references: [id])
  payments      Payment[]

  @@map("subscriptions")
}

enum SubscriptionPlan { FREE BASIC PRO ENTERPRISE }
enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED EXPIRED }

model Payment {
  id             String    @id @default(cuid())
  userId         String
  subscriptionId String
  amount         Int       // 分为单位
  currency       String    @default("CNY")
  channel        PaymentChannel
  channelTradeNo String?   @unique
  status         PaymentStatus @default(PENDING)
  paidAt         DateTime?
  createdAt      DateTime  @default(now())
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])

  @@map("payments")
}

enum PaymentChannel { WECHAT ALIPAY }
enum PaymentStatus { PENDING PAID FAILED REFUNDED }
```

### 三、API Key 管理 (AI 模型设置扩展)

用户可选择两种 AI 调用模式：
- **平台 API**：使用平台提供的 AI 额度（计入订阅配额）
- **自带 Key**：填入自己的 API Key，不计入平台配额

各功能模块（内容生成/消息回复/获客评分等）可独立选择使用平台 API 还是自带 Key。

**数据结构**：
```prisma
model UserApiKey {
  id         String   @id @default(cuid())
  userId     String
  provider   String   // openai / anthropic / custom
  label      String   // "我的 GPT-4o"
  endpoint   String
  apiKey     String   // AES-256 加密存储
  models     Json     // {"default":"gpt-4o-mini","advanced":"gpt-4o","embedding":"text-embedding-3-small"}
  isDefault  Boolean  @default(false)
  lastTestAt DateTime?
  testResult Json?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])

  @@map("user_api_keys")
}
```

### 四、Chrome DevTools Protocol 模块 (架构核心)

替代平台 API 直连，统一使用 CDP 实现所有网页操作。

**CDP 帮助功能**：
- 平台账号管理页的"连接助手"：一键生成 Chrome 启动命令、自动检测连接、检测已登录平台
- 各操作页面的"CDP 执行"按钮：一键通过 CDP 在用户浏览器中执行操作
- CDP 操作预览：执行前展示操作步骤，用户确认后执行

**架构**：
```
用户浏览器 ←(WebSocket:9222)→ CDP Service (NestJS) ←(HTTP API)→ 前端
```

**后端模块**：
- `CdpModule` — CDP 连接管理（连接/断开/心跳检测/连接池）
- `CdpBrowserService` — 浏览器实例管理（标签页/截图/导航）
- `CdpAutomationService` — 自动化操作执行（搜索/填表/点击/提取数据）
- `CdpScriptRegistry` — 平台操作脚本（小红书/抖音/TikTok/Instagram）
- `CdpHelpService` — CDP 配置辅助（生成启动命令/检测连接/检测已登录平台）

### 五、获客模块 (新增一级功能区)

来源：docs/huoke.md。职责：跨平台潜客发现、AI 意向评分、触达活动管理。
数据抓取和消息发送均通过 CDP 执行。

**数据结构**：AcquisitionTask / Prospect / OutreachCampaign（同 v1 plan）

### 六、现有页面交互逻辑补全

同 v1 plan，梳理 12+新增页面的交互闭环。

## 是否有原型设计

是（设计引导工具已开启）

## 实施步骤

1. **阶段一：原型设计** — 加载 design-canvas 技能，完成全部页面原型（新增登录页、订阅与账单页、CDP 帮助组件，更新平台账号管理和 AI 模型设置页），原型完成后提示用户验收确认。涉及文件：`.cozeproj/prototype/web/`

2. **阶段二：认证与用户系统** — 实现登录页（微信扫码 + 短信验证码）、JWT 认证守卫、用户注册/绑定流程、微信 OAuth 回调、短信服务集成。涉及文件：`apps/api/src/modules/auth/`, `apps/web/src/pages/login.tsx`

3. **阶段二：SaaS 订阅与支付** — 实现套餐定义与配额管理、微信支付 Native + 支付宝当面付集成、支付回调处理、订阅状态管理、账单页面。涉及文件：`apps/api/src/modules/payment/`, `apps/api/src/modules/subscription/`, `apps/web/src/pages/settings/billing.tsx`

4. **阶段二：CDP 核心实现** — CDP 连接管理（连接池/心跳/断开重连）、CDP 帮助功能（启动命令生成/连接检测/已登录平台检测）、平台操作脚本模板、截图与数据提取。涉及文件：`apps/api/src/modules/cdp/`, `apps/worker/src/`

5. **阶段二：数据库与后端模块** — Prisma 新增认证/支付/订阅/获客/AI Key 表并迁移，新增 AuthModule/PaymentModule/SubscriptionModule/AcquisitionModule 骨架及 API 路由。涉及文件：`prisma/schema.prisma`, `apps/api/src/modules/`

6. **阶段二：前端页面开发** — 登录页 + 全部运营面板页面（总览/订单/商品/消息/获客/运营中心/图像视频生成/草稿审核/自动化/平台账号管理/AI模型设置/订阅账单/自动托管/审批），补全交互逻辑，接入 API 和 CDP。涉及文件：`apps/web/src/pages/`, `apps/web/src/components/`, `apps/web/src/router.tsx`

7. **阶段二：集成测试与验收** — 全页面交互走查、登录流程测试、支付流程测试、CDP 连接测试、AI 模型调用测试、获客流程端到端测试。涉及文件：无新增，验证性步骤

## 页面规格

##### @nav(web-topbar)
> type: topbar
> platform: web

- @page(/) 总览
- @page(/orders) 订单
- @page(/products) 商品
- @page(/messages) 消息
- @page(/acquisition) 获客
- @page(/media) 运营中心
- @page(/media-creative) 图像视频生成
- @page(/media-drafts) 草稿审核发布
- @page(/automation) 自动化
- @page(/settings/accounts) 平台账号管理
- @page(/settings/ai-models) AI模型设置
- @page(/settings/billing) 订阅与账单
- @page(/settings/autopilot) 自动托管模式
- @page(/settings/approval) 审批

##### @page(/login) 登录

**核心职责**：用户身份验证，微信扫码或短信验证码登录系统。
**访问路径**：未登录时自动跳转，或手动访问 /login。
**布局**：居中卡片式布局 → 左侧品牌信息 + 右侧登录表单 → Tab 切换（微信扫码/短信验证）。
**状态**：
- 微信扫码态：显示二维码 + "请使用微信扫描登录"
- 短信验证态：手机号输入 + 验证码输入 + 发送/登录按钮
- 扫码成功态：显示"登录成功，正在跳转..."
- 验证码已发送态：60s 倒计时重发按钮

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 微信扫码 Tab | 切换 | 显示微信二维码，轮询扫码状态 | — | 3s 轮询 |
| 短信验证 Tab | 切换 | 显示手机号+验证码表单 | — | — |
| 发送验证码按钮 | 点击 | 发送短信验证码，启动 60s 倒计时 | phone | — |
| 登录按钮 | 点击 | 验证码校验 → 签发 JWT → 跳转 @page(/) | phone, code | — |
| 微信扫码成功 | 扫码 | 签发 JWT → 跳转 @page(/) | openid, code | — |
| Logo | 点击 | 刷新登录页 | — | — |

##### @page(/) 总览

**核心职责**：一目了然掌握今日运营全局，快速跳转各功能区。
**访问路径**：登录后默认页，顶部导航直达。
**布局**：顶部 4 指标卡（今日 GMV / 待处理订单 / 今日浏览量 / 媒体待审核）→ 中部双列（电商运营 + 媒体运营卡片组）→ 下部双列（平台数据榜单 + 互动用户名单）→ 底部系统设置入口。
**列表项字段**：平台 / 浏览 / 点赞 / 收藏 / 互动率（数据榜单）
**状态**：
- 空态：显示"暂无今日数据，连接浏览器后开始同步"
- 加载态：指标骨架屏

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 指标卡 | 点击 | 跳转对应页面 | — | 按指标类型跳转 |
| 电商运营卡片 | 点击 | 跳转对应页面 | — | — |
| 媒体运营卡片 | 点击 | 跳转 @page(/media) | — | — |
| 数据榜单行 | 点击 | 展开该平台 7 日趋势 | platform | — |
| 互动用户行 | 点击 | 跳转 @page(/acquisition) | — | — |
| 系统设置卡片 | 点击 | 跳转对应设置页 | — | — |
| 刷新按钮 | 点击 | 重新拉取指标数据 | — | — |

##### @page(/orders) 订单

**核心职责**：集中处理跨平台订单、物流异常和退款。
**访问路径**：顶部导航直达。
**布局**：顶部 4 指标 → 筛选条（平台/状态/优先级/搜索）→ 订单表格 → 订单详情抽屉。
**列表项字段**：订单号 / 平台 / 状态 / 金额 / 优先级 / 操作
**状态**：
- 空态："暂无订单"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 筛选条 | 变更 | 刷新表格 | platform, status, priority | — |
| 搜索框 | 输入 | 模糊搜索 | keyword | 防抖 300ms |
| 订单行 | 点击 | 打开详情抽屉 | orderId | — |
| AI 处理按钮 | 点击 | AI 生成处理建议 | orderId | — |
| 确认执行 | 点击 | 提交审批 → CDP 执行 | orderId | 高优先级需审批 |
| 批量处理 | 点击 | 弹出批量确认 | orderIds[] | — |

##### @page(/products) 商品

**核心职责**：管理 Listing、库存和跨平台同步。
**访问路径**：顶部导航直达。
**布局**：顶部 3 统计卡 → 商品表格。
**列表项字段**：SKU / 商品名 / 库存 / 同步平台 / 状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 优化建议按钮 | 点击 | AI 生成优化建议 | skuId | 调模型 |
| 同步按钮 | 点击 | CDP 同步到各平台 | skuId, platforms[] | 需审批 |
| 商品行 | 点击 | 展开商品详情面板 | skuId | — |

##### @page(/messages) 消息

**核心职责**：集中处理买家咨询和社媒私信，AI 辅助回复。
**访问路径**：顶部导航直达。
**布局**：左列消息列表（分类标签）→ 右列消息详情 + AI 回复工作台。
**列表项字段**：来源 / 标题 / 等待时长 / 紧急度 / 状态

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 分类标签 | 切换 | 过滤消息列表 | category | — |
| 消息行 | 点击 | 右侧显示详情 + AI 回复草稿 | messageId | — |
| 生成回复 | 点击 | AI 生成回复草稿 | messageId | 调模型 |
| 换语气 | 点击 | 重新生成不同语气 | messageId, tone | — |
| 翻译 | 点击 | 翻译为中/英文 | messageId, lang | — |
| 放入审批 | 点击 | 提交审批 → CDP 发送 | messageId, replyContent | 需审批 |
| 快速回复 | 点击 | 直接发送低风险回复 | messageId | 免审批 |

##### @page(/acquisition) 获客

**核心职责**：跨平台潜客发现、AI 评分、触达活动管理。
**访问路径**：顶部导航直达。
**布局**：顶部统计 → Tab 切换（任务管理/潜客库/触达活动）。
**列表项字段**（潜客库）：用户名 / 平台 / 互动类型 / 意向评分 / 状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 创建任务 | 点击 | 弹出创建任务弹窗 | — | — |
| 任务-启动 | 点击 | CDP 执行抓取 | taskId | 需连接浏览器 |
| 潜客行-详情 | 点击 | 打开详情抽屉 | prospectId | — |
| 潜客行-加入触达 | 点击 | 选择触达活动 | prospectId | — |
| 创建触达 | 点击 | 弹出创建触达弹窗 | — | — |
| 触达-提交审批 | 点击 | 审批后 CDP 发送 | campaignId | 必须审批 |
| 导出 | 点击 | 弹出导出确认 | prospectIds[] | >100 条需审批 |

##### @page(/media) 运营中心

**核心职责**：媒体账号矩阵总览 + 内容生产线入口。
**访问路径**：顶部导航直达。
**布局**：顶部 4 指标 → 双列（媒体账号矩阵 + 运营入口）→ 底部媒体排期。
**列表项字段**：平台 / 功能 / 连接状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 连接账号 | 点击 | 跳转 @page(/settings/accounts) | — | — |
| 图像视频生成入口 | 点击 | 跳转 @page(/media-creative) | — | — |
| 草稿审核发布入口 | 点击 | 跳转 @page(/media-drafts) | — | — |
| 账号行-连接 | 点击 | CDP 检测浏览器会话 | platform | — |

##### @page(/media-creative) 图像视频生成

**核心职责**：AI 生成图文、配图建议和视频脚本。
**访问路径**：顶部导航直达或运营中心跳转。
**布局**：双列生成器表单 → 双列生成结果 → 底部平台适配表。
**状态**：
- 生成中：加载动画 + "AI 正在创作..."
- 生成完成：显示结果卡片

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| API 来源选择 | 切换 | 选择平台 API 或自带 Key | source | 新增 |
| 生成按钮 | 点击 | 调用 AI 模型生成 | topic, platform, direction | — |
| 保存草稿 | 点击 | 保存到草稿库 | contentId | — |
| 提交审核 | 点击 | 保存并跳转审核 | contentId | — |
| 平台适配-生成 | 点击 | 为该平台生成适配版 | platform, contentId | — |

##### @page(/media-drafts) 草稿审核发布

**核心职责**：预览草稿、审核检查、发布到平台。
**访问路径**：顶部导航直达。
**布局**：草稿列表 → 预览区 → 审核清单 + 多平台发布表。
**列表项字段**：标题 / 平台 / 素材状态 / 风险 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 草稿行 | 点击 | 显示预览 | draftId | — |
| 编辑 | 点击 | 进入编辑模式 | draftId | — |
| 审核-修复 | 点击 | 自动修复或提示 | checkId | — |
| 发布 | 点击 | 审批后 CDP 发布 | draftId, platforms[] | 需审批 |
| 批量审核通过 | 点击 | 批量提交审批 | draftIds[] | — |

##### @page(/automation) 自动化

**核心职责**：配置定时自动化任务。
**访问路径**：顶部导航直达。
**布局**：自动化列表（启停开关 + 执行日志入口）+ 新建表单。
**列表项字段**：规则名 / 触发条件 / 状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 新建自动化 | 点击 | 弹出创建弹窗 | — | — |
| 启停开关 | 切换 | 启用/暂停 | automationId, enabled | — |
| 执行日志 | 点击 | 打开日志抽屉 | automationId | — |
| 编辑/删除 | 点击 | 弹出编辑/确认弹窗 | automationId | — |

##### @page(/settings/accounts) 平台账号管理

**核心职责**：管理 Chrome 浏览器连接、CDP 帮助辅助配置、平台会话管理。
**访问路径**：顶部导航直达。
**布局**：浏览器连接状态卡 + CDP 帮助向导 → 平台会话列表 → Chrome 调试配置说明。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| CDP 帮助按钮 | 点击 | 打开 CDP 配置向导 | — | 新增，核心功能 |
| 连接浏览器 | 点击 | 弹出连接引导弹窗 | — | — |
| 断开浏览器 | 点击 | 断开 CDP 连接 | — | 需确认 |
| 一键检测已登录平台 | 点击 | CDP 扫描浏览器已登录平台 | — | 新增 |
| 平台-检测登录 | 点击 | CDP 检测平台登录状态 | platform | — |
| 平台-登录引导 | 点击 | CDP 打开平台登录页 | platform | 用户手动登录 |
| 浏览器截图 | 点击 | CDP 截取当前标签页 | tabId | 调试用 |

**底部面板 cdp-help-wizard**：
- Step 1：检测本机 Chrome 和调试端口
- Step 2：生成启动命令（macOS/Windows/Linux）
- Step 3：连接浏览器 → 自动扫描已登录平台
- Step 4：引导登录未连接平台
- 操作：下一步/上一步/跳过/完成

##### @page(/settings/ai-models) AI模型设置

**核心职责**：配置 AI 模型接入方式，支持平台 API 和自带 Key 双模式。
**访问路径**：顶部导航直达。
**布局**：API 来源选择（平台 API / 自带 Key）→ 模型配置表单 → 已保存 Key 列表 → 测试连接。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| API 来源选择 | 切换 | 切换平台 API / 自带 Key 模式 | source | 新增 |
| 平台 API 额度显示 | 查看 | 显示当前套餐额度使用情况 | — | 平台 API 模式下 |
| 添加 Key 按钮 | 点击 | 弹出添加 Key 表单 | — | 自带 Key 模式下 |
| Key 行-测试 | 点击 | 测试该 Key 连通性 | keyId | — |
| Key 行-设为默认 | 点击 | 设为默认 Key | keyId | — |
| Key 行-删除 | 点击 | 弹出确认删除 | keyId | — |
| 提供商选择 | 切换 | 更新默认端点 | provider | — |
| 测试连接 | 点击 | 发送测试请求 | config | — |
| 保存配置 | 点击 | 保存配置 | config | — |

##### @page(/settings/billing) 订阅与账单

**核心职责**：管理 SaaS 订阅套餐、查看账单和支付。
**访问路径**：顶部导航直达。
**布局**：当前套餐信息 → 套餐对比表 → 升级/降级按钮 → 支付弹窗 → 账单历史列表。
**列表项字段**（账单）：日期 / 套餐 / 金额 / 支付方式 / 状态

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 升级按钮 | 点击 | 弹出 @modal(upgrade-confirm) | targetPlan | — |
| 降级按钮 | 点击 | 弹出 @modal(downgrade-confirm) | targetPlan | — |
| 支付方式选择 | 切换 | 微信支付 / 支付宝 | channel | — |
| 立即支付 | 点击 | 生成支付二维码 @modal(pay-qrcode) | plan, channel | — |
| 账单行 | 点击 | 展开账单详情 | billId | — |
| 取消订阅 | 点击 | 弹出确认 @modal(cancel-confirm) | — | — |

**弹窗 upgrade-confirm**：
- 标题："确认升级到 X 套餐"
- 内容：当前套餐 → 目标套餐，价格差异，即时生效/按比例退款
- 操作：确认升级、取消

**弹窗 pay-qrcode**：
- 标题："扫码支付"
- 内容：支付二维码（微信/支付宝），订单金额，3s 轮询支付状态
- 操作：支付成功自动关闭弹窗并刷新页面

**弹窗 cancel-confirm**：
- 标题："确认取消订阅"
- 内容：取消后降级为免费版，当前周期结束后生效
- 操作：确认取消、保留订阅

##### @page(/settings/autopilot) 自动托管模式

**核心职责**：配置 AI 自动运营的风险边界。
**访问路径**：顶部导航直达。
**布局**：风险警告横幅 → 托管模式开关 → 风险边界配置 → 操作日志。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 托管模式切换 | 切换 | 弹出确认弹窗 | mode | — |
| 风险边界配置 | 点击 | 弹出风险配置弹窗 | — | — |
| 配置边界按钮 | 点击 | 弹出风险配置弹窗 | — | — |
| 操作日志行 | 点击 | 展开日志详情 | logId | — |

##### @page(/settings/approval) 审批

**核心职责**：确认 AI 准备执行的高风险操作。
**访问路径**：顶部导航直达。
**布局**：Tab 切换（待审批/审批历史）→ 审批队列列表。
**列表项字段**：操作名称 / 类型 / 风险等级 / 创建时间 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 审批行 | 点击 | 展开详情面板 | approvalId | — |
| 批准 | 点击 | CDP 执行操作 + 记录日志 | approvalId | — |
| 驳回 | 点击 | 驳回 + 记录原因 | approvalId | — |
| 批量批准 | 点击 | 弹出批量确认弹窗 | approvalIds[] | — |
| 审批历史 Tab | 点击 | 切换到历史列表 | — | — |
