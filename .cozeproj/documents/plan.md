# AI Commerce Ops Dashboard — 重构开发方案

## 概述

对跨境电商 AI 运营中控台进行架构级重构。核心变更三点：(1) 新增"获客"一级功能区（源自 docs/huoke.md）；(2) 新增"AI 模型接入设置"系统设置模块；(3) 将平台连接方式从 API 直连改为基于 Chrome DevTools Protocol (CDP) 的网页自动化方案——用户连接自己的 Chrome 浏览器，AI 通过 CDP 远程操控用户的浏览器会话完成网页操作。同时梳理全部 12 个静态页面的交互逻辑，补全缺失的功能闭环。平台：Web。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 前端框架 | React 19 + Vite (已有) | 项目已初始化，沿用 |
| UI 组件 | shadcn/ui + Tailwind v4 | 与设计引导工具一致 |
| 后端框架 | NestJS (已有) | 沿用，新增 CDP 模块 |
| 浏览器自动化 | Chrome DevTools Protocol (CDP) via puppeteer-core | 用户本地 Chrome，后端通过 CDP 远程操控，无需平台 API 授权 |
| 获客数据抓取 | CDP 替代 Apify/MCP | 统一技术栈，通过用户浏览器会话直接操作平台页面 |
| 数据库 | PostgreSQL + Prisma (已有) | 沿用，新增获客相关表 |
| 任务队列 | BullMQ + Redis (已有) | 沿用，新增获客队列 |
| AI 模型接入 | OpenAI 兼容 API / Anthropic API | 用户在设置中自行配置模型端点和密钥 |

## 功能模块

### 一、获客模块 (新增一级功能区)

来源：docs/huoke.md。职责：跨平台潜客发现、AI 意向评分、触达活动管理。

**核心页面**：
- **获客总览**：任务看板 + 潜客库统计 + 触达活动状态
- **任务管理**：创建获客任务（选平台 → 定义搜索条件 → CDP 执行抓取）
- **潜客库**：AI 评分后的潜客列表，支持筛选/排序/导出
- **触达活动**：创建触达（选模板 → AI 个性化改写 → 审批 → CDP 发送）

**CDP 抓取流程**：
1. 用户在设置中连接 Chrome 浏览器（本地或远程调试模式）
2. 创建获客任务时，选择目标平台和搜索条件
3. 后端通过 CDP 在用户的浏览器中打开目标平台页面
4. CDP 自动执行搜索、滚动、提取用户数据
5. 数据入库 → AI 评分 → 进入潜客库

**数据结构**（Prisma 新增表）：
```prisma
model AcquisitionTask {
  id          String   @id @default(cuid())
  teamId      String
  platform    String   // xiaohongshu / douyin / tiktok / instagram / linkedin / twitter
  searchQuery String   // 搜索关键词
  status      String   // PENDING / RUNNING / COMPLETED / FAILED
  prospectCount Int    @default(0)
  createdAt   DateTime @default(now())
}

model Prospect {
  id              String   @id @default(cuid())
  taskId          String
  platform        String
  platformUserId  String
  displayName     String?
  username        String?
  bio             String?
  intentScore     Int?     // 0-100
  intentLabel     String?  // HOT / WARM / COLD
  intentReason    String?
  status          String   // NEW / SCORED / CONTACTED / EXCLUDED
  rawData         Json?
  createdAt       DateTime @default(now())
}

model OutreachCampaign {
  id          String   @id @default(cuid())
  teamId      String
  name        String
  platform    String
  template    String
  status      String   // DRAFT / PENDING_APPROVAL / APPROVED / RUNNING / COMPLETED
  prospectIds String[]
  sentCount   Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### 二、Chrome DevTools Protocol 连接模块 (新架构核心)

替代原来的平台 API 直连 + Apify 方案，统一使用 CDP 实现所有网页操作。

**架构**：
```
用户浏览器 ←(WebSocket)→ CDP Server ←(HTTP API)→ NestJS 后端 ←(HTTP)→ 前端
```

**连接方式**：
- 用户在本地 Chrome 启动时加 `--remote-debugging-port=9222`
- 或通过系统设置中的"连接浏览器"引导一键配置
- 后端 CDP Service 管理连接池，每个用户会话对应一个 Chrome 实例

**CDP 能力映射**：
| 原方案 | CDP 替代 | 操作 |
|--------|---------|------|
| 平台 API 获取数据 | CDP 页面抓取 | 导航到页面 → 提取 DOM 数据 |
| Apify 抓取用户 | CDP 自动搜索 | 打开搜索页 → 输入关键词 → 提取结果 |
| 发私信/评论 | CDP 表单填写 | 定位输入框 → 输入内容 → 点击发送 |
| 发布内容 | CDP 页面操作 | 打开发布页 → 上传素材 → 填写表单 → 提交 |
| 登录授权 | 用户自行登录 | 用户在自己的 Chrome 中登录，CDP 复用会话 |

**后端新增模块**：
- `CdpModule` — CDP 连接管理（连接/断开/心跳检测）
- `CdpBrowserService` — 浏览器实例管理（标签页创建/关闭/截图）
- `CdpAutomationService` — 自动化操作执行（导航/填表/点击/提取数据）
- `CdpScriptRegistry` — 平台操作脚本注册（每个平台一套操作模板）

### 三、AI 模型接入设置 (系统设置新增)

用户可自行配置 AI 模型的接入方式，不再硬编码模型供应商。

**配置项**：
| 字段 | 说明 | 示例 |
|------|------|------|
| 模型提供商 | OpenAI 兼容 / Anthropic / 自定义 | openai-compatible |
| API 端点 | 模型服务地址 | https://api.openai.com/v1 |
| API 密钥 | 加密存储 | sk-*** |
| 默认模型 | 日常推理模型 | gpt-4o-mini |
| 高级模型 | 复杂任务模型 | gpt-4o |
| 嵌入模型 | 向量化模型 | text-embedding-3-small |
| 最大并发 | 并发请求数 | 5 |
| 超时时间 | 请求超时(ms) | 30000 |

**影响范围**：
- 获客模块的 AI 意向评分 → 调用用户配置的模型
- 消息生成 → 调用用户配置的模型
- 内容生成 → 调用用户配置的模型
- AI 指挥台 → 调用用户配置的模型

### 四、现有页面交互逻辑梳理与补全

当前 12 个静态页面仅有点击跳转和 Toast 提示，缺少核心交互闭环。需补全的逻辑：

| 页面 | 当前状态 | 需补全的交互 |
|------|---------|-------------|
| 总览 | 纯展示 | 卡片点击跳转对应页面、数据刷新、指标趋势图 |
| 订单 | 列表展示 | 筛选/排序/搜索、订单详情抽屉、批量处理、状态流转 |
| 商品 | 列表展示 | 库存预警、Listing 优化建议、跨平台同步状态 |
| 消息 | 展示+AI回复框 | 消息分类筛选、AI 回复生成(调模型)、审核发送(调CDP)、消息详情 |
| 运营中心 | 展示+跳转 | 账号连接状态联动、内容排期日历 |
| 图像视频生成 | 表单+展示 | 生成请求(调模型)、生成结果预览、保存到草稿 |
| 草稿审核发布 | 展示+审核 | 草稿编辑、风险检查、审批流程、发布执行(调CDP) |
| 自动化 | 纯展示 | 创建/编辑/删除自动化、启停开关、执行日志 |
| 平台账号管理 | 展示状态 | CDP 连接状态、连接/断开浏览器、会话管理 |
| 自动托管模式 | 展示+警告 | 风险边界配置、托管模式开关、操作日志 |
| 审批 | 展示+审批 | 审批/驳回、批量操作、审批历史 |
| **获客(新)** | — | 完整 CRUD + AI 评分 + 触达 |

## 是否有原型设计

是（设计引导工具已开启）

## 实施步骤

1. **阶段一：原型设计** — 加载 design-canvas 技能，按流程完成全部页面的原型设计（含新增获客模块 4 页 + AI 模型设置 + 现有 12 页交互逻辑补全），原型完成后提示用户验收确认。涉及文件：`.cozeproj/prototype/web/`

2. **阶段二：数据库与后端基础** — 新增 Prisma 迁移（acquisition_task / prospect / outreach_campaign 3 张表 + ai_model_config 表），新增 CdpModule / AcquisitionModule 骨架及 API 路由，新增 AI 模型配置 CRUD。涉及文件：`prisma/schema.prisma`, `apps/api/src/modules/cdp/`, `apps/api/src/modules/acquisition/`

3. **阶段二：CDP 核心实现** — 实现 CDP 连接管理（WebSocket 连接池、心跳检测）、浏览器标签页管理、平台操作脚本模板（小红书/抖音/TikTok/Instagram 搜索抓取 + 发消息 + 发布内容）、截图与数据提取。涉及文件：`apps/api/src/modules/cdp/`, `apps/worker/src/`

4. **阶段二：获客模块后端** — 实现获客任务 CRUD、CDP 抓取 Worker、AI 评分 Processor（调用用户配置的模型）、触达活动 CRUD + 审批集成、限速规则。涉及文件：`apps/api/src/modules/acquisition/`, `apps/worker/src/`

5. **阶段二：前端页面重构（电商运营区）** — 重构总览/订单/商品/消息 4 个页面，补全交互逻辑（筛选/排序/详情抽屉/AI 回复/CDP 发送），接入 API。涉及文件：`apps/web/src/pages/`, `apps/web/src/components/`

6. **阶段二：前端页面重构（媒体运营区）** — 重构运营中心/图像视频生成/草稿审核发布/自动化 4 个页面，补全内容生成(调模型)、审核发布(调CDP)、自动化配置。涉及文件：`apps/web/src/pages/`, `apps/web/src/components/`

7. **阶段二：新增获客+系统设置页面** — 新增获客总览/任务管理/潜客库/触达活动 4 个页面，新增 AI 模型接入设置页面，重构平台账号管理（CDP 连接）、自动托管、审批页面。涉及文件：`apps/web/src/pages/`, `apps/web/src/components/`, `apps/web/src/router.tsx`

8. **阶段二：集成测试与验收** — 全页面交互走查、CDP 连接测试、AI 模型调用测试、获客流程端到端测试。涉及文件：无新增，验证性步骤

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
- @page(/settings/autopilot) 自动托管模式
- @page(/settings/approval) 审批

##### @page(/) 总览

**核心职责**：一目了然掌握今日运营全局，快速跳转各功能区。
**访问路径**：顶部导航直达。
**布局**：顶部 4 个指标卡（今日 GMV / 待处理订单 / 今日浏览量 / 媒体待审核）→ 中部双列（电商运营 + 媒体运营卡片组）→ 下部双列（平台数据榜单 + 互动用户名单）→ 底部系统设置入口。
**列表项字段**：平台 / 浏览 / 点赞 / 收藏 / 互动率（数据榜单）
**状态**：
- 空态：显示"暂无今日数据，连接浏览器后开始同步"
- 加载态：指标骨架屏
- 错误态：指标区显示重试按钮

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 指标卡 | 点击 | 跳转对应页面 @page(/orders) 或 @page(/media) | — | 按指标类型跳转 |
| 电商运营卡片(订单/商品/消息) | 点击 | 跳转 @page(/orders) / @page(/products) / @page(/messages) | — | — |
| 媒体运营卡片(数据榜单/互动用户/草稿审核) | 点击 | 跳转 @page(/media) | — | — |
| 数据榜单行 | 点击 | 展开该平台 7 日趋势 mini 图 | platform | — |
| 互动用户行 | 点击 | 跳转 @page(/acquisition) | — | — |
| 系统设置卡片 | 点击 | 跳转对应设置页 | — | — |
| 刷新按钮 | 点击 | 重新拉取指标数据 | — | — |

##### @page(/orders) 订单

**核心职责**：集中处理跨平台订单、物流异常和退款。
**访问路径**：顶部导航直达。
**布局**：顶部 4 指标 → 筛选条（平台/状态/优先级/搜索）→ 订单表格 → 订单详情抽屉。
**列表项字段**：订单号 / 平台 / 状态 / 金额 / 优先级 / 操作
**状态**：
- 空态：显示"暂无订单"
- 加载态：表格骨架屏

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 筛选条 | 变更 | 刷新表格 | platform, status, priority | — |
| 搜索框 | 输入 | 模糊搜索订单号/买家 | keyword | 防抖 300ms |
| 订单行 | 点击 | 打开订单详情抽屉 | orderId | — |
| 处理按钮 | 点击 | AI 生成处理建议 → 确认后通过 CDP 在平台执行 | orderId | 高优先级操作需审批 |
| 批量处理 | 点击 | 弹出批量操作确认 | orderIds[] | — |
| 详情抽屉-物流查询 | 点击 | 通过 CDP 在平台页面查询物流 | orderId, platform | — |
| 详情抽屉-退款处理 | 点击 | 弹出退款确认 @modal(refund-confirm) | orderId | 需审批 |

**弹窗 refund-confirm**：
- 标题："确认退款"
- 内容：订单号、退款金额、退款原因
- 操作：确认（提交审批后通过 CDP 执行）、取消

##### @page(/products) 商品

**核心职责**：管理 Listing、库存和跨平台同步。
**访问路径**：顶部导航直达。
**布局**：顶部 3 统计卡 → 商品表格（支持排序/筛选）。
**列表项字段**：SKU / 商品名 / 库存 / 同步平台 / 状态 / 操作
**状态**：
- 空态："暂无商品数据"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 商品行 | 点击 | 展开商品详情面板 | skuId | — |
| 优化建议按钮 | 点击 | AI 生成 Listing 优化建议 | skuId | 调模型 |
| 同步按钮 | 点击 | 通过 CDP 在各平台同步 Listing | skuId, platforms[] | 需审批 |
| 补货提醒 | 点击 | 生成补货建议并通知 | skuId | — |

##### @page(/messages) 消息

**核心职责**：集中处理买家咨询和社媒私信，AI 辅助回复。
**访问路径**：顶部导航直达。
**布局**：左列消息列表（分类标签：买家咨询/评价/私信）→ 右列消息详情 + AI 回复工作台。
**列表项字段**：来源 / 标题 / 等待时长 / 紧急度 / 状态
**状态**：
- 空态："暂无待处理消息"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 分类标签 | 切换 | 过滤消息列表 | category | — |
| 消息行 | 点击 | 右侧显示详情 + AI 生成回复草稿 | messageId | — |
| 生成回复按钮 | 点击 | AI 生成回复草稿 | messageId, context | 调模型 |
| 换语气按钮 | 点击 | 重新生成不同语气回复 | messageId, tone | — |
| 翻译按钮 | 点击 | 翻译为中/英文 | messageId, lang | — |
| 放入审批按钮 | 点击 | 提交审批，审批通过后通过 CDP 发送 | messageId, replyContent | 需审批 |
| 快速回复 | 点击 | 直接发送低风险回复 | messageId | 免审批 |

##### @page(/acquisition) 获客

**核心职责**：跨平台潜客发现、AI 评分、触达活动管理。
**访问路径**：顶部导航直达。
**布局**：顶部统计（新增潜客/已触达/触达转化率/进行中任务）→ Tab 切换（任务管理/潜客库/触达活动）。
**列表项字段**（潜客库）：用户名 / 平台 / 互动类型 / 意向评分 / 状态 / 操作
**列表项字段**（任务管理）：任务名 / 平台 / 状态 / 潜客数 / 创建时间 / 操作
**列表项字段**（触达活动）：活动名 / 平台 / 状态 / 发送数 / 操作
**状态**：
- 空态："创建第一个获客任务，AI 帮你找到高意向客户"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 创建任务按钮 | 点击 | 弹出 @modal(create-task) | — | — |
| 任务行-启动 | 点击 | 通过 CDP 在平台执行抓取 | taskId | 需连接浏览器 |
| 任务行-查看结果 | 点击 | 切换到潜客库 Tab，筛选该任务 | taskId | — |
| 潜客行-详情 | 点击 | 打开潜客详情抽屉（评分理由+互动记录） | prospectId | — |
| 潜客行-加入触达 | 点击 | 选择或创建触达活动 | prospectId | — |
| 创建触达按钮 | 点击 | 弹出 @modal(create-campaign) | — | — |
| 触达活动-编辑模板 | 点击 | 打开消息模板编辑器 | campaignId | — |
| 触达活动-提交审批 | 点击 | 提交审批，审批通过后通过 CDP 发送 | campaignId | 批量发私信必须审批 |
| 潜客导出 | 点击 | 弹出 @modal(export-confirm) | prospectIds[] | >100 条需审批 |

**弹窗 create-task**：
- 平台选择：小红书/抖音/TikTok/Instagram/LinkedIn/Twitter
- 搜索关键词输入
- 抓取类型：搜索用户/搜索帖子评论/搜索话题
- 预估数量
- 操作：确认创建、取消

**弹窗 create-campaign**：
- 活动名称
- 目标平台
- 消息模板（可 AI 个性化改写）
- 选择潜客范围
- 操作：创建草稿、取消

**弹窗 export-confirm**：
- 导出数量、字段选择
- 操作：确认导出（>100 条进入审批）、取消

##### @page(/media) 运营中心

**核心职责**：媒体账号矩阵总览 + 内容生产线入口。
**访问路径**：顶部导航直达。
**布局**：顶部 4 指标 → 左列媒体账号矩阵（连接状态+操作入口）→ 右列运营中心（内容生产/审核发布入口）→ 底部媒体排期。
**列表项字段**：平台 / 功能 / 连接状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 连接账号按钮 | 点击 | 跳转 @page(/settings/accounts) | — | — |
| 图像视频生成入口 | 点击 | 跳转 @page(/media-creative) | — | — |
| 草稿审核发布入口 | 点击 | 跳转 @page(/media-drafts) | — | — |
| 账号行-连接 | 点击 | 通过 CDP 检测浏览器会话 | platform | — |
| 排期行 | 点击 | 展开排期详情 | scheduleId | — |

##### @page(/media-creative) 图像视频生成

**核心职责**：AI 生成图文、配图建议和视频脚本。
**访问路径**：顶部导航直达或运营中心跳转。
**布局**：左列生成器表单（选题+平台选择+生成方向）→ 右列生成结果预览 → 底部平台适配表。
**状态**：
- 生成中：结果区显示加载动画 + "AI 正在创作..."
- 生成完成：显示结果卡片

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 生成按钮 | 点击 | 调用 AI 模型生成内容 | topic, platform, direction | — |
| 结果-保存草稿 | 点击 | 保存到草稿库 | contentId | — |
| 结果-编辑 | 点击 | 进入编辑模式 | contentId | — |
| 结果-提交审核 | 点击 | 保存草稿并跳转审核 | contentId | — |
| 平台适配行-生成 | 点击 | 为该平台生成适配版本 | platform, contentId | — |

##### @page(/media-drafts) 草稿审核发布

**核心职责**：预览草稿、审核检查、发布到平台。
**访问路径**：顶部导航直达。
**布局**：左列草稿列表 → 右列预览区 → 底部审核清单 + 多平台发布表。
**列表项字段**：标题 / 平台 / 素材状态 / 风险 / 操作
**状态**：
- 空态："暂无待审核草稿"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 草稿行 | 点击 | 右侧显示预览 | draftId | — |
| 预览区-编辑 | 点击 | 进入编辑模式 | draftId | — |
| 审核清单-修复 | 点击 | 自动修复或提示手动修复 | checkId | — |
| 发布按钮 | 点击 | 提交审批，通过后通过 CDP 发布 | draftId, platforms[] | 需审批 |
| 批量审核通过 | 点击 | 批量提交审批 | draftIds[] | — |

##### @page(/automation) 自动化

**核心职责**：配置定时自动化任务。
**访问路径**：顶部导航直达。
**布局**：自动化列表（启停开关+执行日志入口）。
**列表项字段**：规则名 / 触发条件 / 状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 新建自动化按钮 | 点击 | 弹出 @modal(create-automation) | — | — |
| 启停开关 | 切换 | 启用/暂停自动化 | automationId, enabled | — |
| 执行日志 | 点击 | 打开日志抽屉 | automationId | — |
| 编辑 | 点击 | 弹出 @modal(edit-automation) | automationId | — |
| 删除 | 点击 | 弹出确认 @modal(delete-confirm) | automationId | — |

**弹窗 create-automation**：
- 规则名称
- 触发条件：定时/事件触发
- 执行动作：数据汇总/消息生成/内容排期
- 操作：保存、取消

##### @page(/settings/accounts) 平台账号管理

**核心职责**：管理 Chrome 浏览器连接和平台会话。
**访问路径**：顶部导航直达。
**布局**：浏览器连接状态卡 → 平台会话列表。
**列表项字段**：平台 / 功能 / 连接状态 / 操作

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 连接浏览器按钮 | 点击 | 弹出 @modal(connect-browser) 引导 | — | — |
| 断开浏览器按钮 | 点击 | 断开 CDP 连接 | — | 需确认 |
| 平台-检测登录 | 点击 | 通过 CDP 检测该平台登录状态 | platform | — |
| 平台-登录引导 | 点击 | 通过 CDP 打开平台登录页 | platform | 用户手动登录 |
| 浏览器截图 | 点击 | 通过 CDP 截取当前标签页 | tabId | 调试用 |

**弹窗 connect-browser**：
- 标题："连接你的 Chrome 浏览器"
- 步骤引导：1) 关闭所有 Chrome 窗口 → 2) 复制启动命令（含 --remote-debugging-port=9222）→ 3) 打开 Chrome → 4) 点击"检测连接"
- 操作：检测连接、取消

##### @page(/settings/ai-models) AI模型设置

**核心职责**：配置 AI 模型接入参数。
**访问路径**：顶部导航直达。
**布局**：模型提供商选择 → API 配置表单 → 模型选择 → 测试连接。
**状态**：
- 未配置：显示引导文案
- 已配置：显示当前配置 + 测试结果

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 提供商选择 | 切换 | 更新默认端点和模型列表 | provider | — |
| API 端点输入 | 输入 | 更新端点 | endpoint | — |
| API 密钥输入 | 输入 | 加密存储 | apiKey | — |
| 测试连接按钮 | 点击 | 发送测试请求，显示延迟和模型信息 | config | — |
| 保存按钮 | 点击 | 保存配置 | config | — |
| 重置按钮 | 点击 | 恢复默认配置 | — | — |

##### @page(/settings/autopilot) 自动托管模式

**核心职责**：配置 AI 自动运营的风险边界。
**访问路径**：顶部导航直达。
**布局**：顶部风险警告横幅 → 托管模式开关 → 风险边界配置 → 操作日志。
**状态**：
- 关闭态：显示"当前为手动模式"
- 半自动态：显示允许/禁止的操作列表
- 全自动态：红色警告

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 托管模式切换 | 切换 | 弹出确认 @modal(mode-confirm) | mode | — |
| 风险边界配置 | 点击 | 弹出 @modal(risk-config) | — | — |
| 操作日志行 | 点击 | 展开日志详情 | logId | — |
| 配置边界按钮 | 点击 | 弹出 @modal(risk-config) | — | — |

**弹窗 mode-confirm**：
- 标题："确认切换托管模式"
- 内容：当前模式 → 目标模式，列出影响
- 操作：确认切换、取消

**弹窗 risk-config**：
- 允许自动执行的操作列表（勾选）
- 禁止自动执行必须审批的操作列表
- 操作：保存、取消

##### @page(/settings/approval) 审批

**核心职责**：确认 AI 准备执行的高风险操作。
**访问路径**：顶部导航直达。
**布局**：审批队列列表 → 审批详情面板。
**列表项字段**：操作名称 / 类型 / 风险等级 / 创建时间 / 操作
**状态**：
- 空态："暂无待审批操作"

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 审批行 | 点击 | 展开详情面板 | approvalId | — |
| 批准按钮 | 点击 | 执行操作（通过 CDP）+ 记录日志 | approvalId | — |
| 驳回按钮 | 点击 | 驳回+记录原因 | approvalId | — |
| 批量批准 | 点击 | 弹出确认 @modal(batch-approve) | approvalIds[] | — |
| 审批历史 | 点击 | 切换到历史 Tab | — | — |

**弹窗 batch-approve**：
- 标题："批量审批确认"
- 内容：列出所有待审批项
- 操作：确认全部批准、取消
