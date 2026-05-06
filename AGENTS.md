# AI Commerce Ops Dashboard

跨境电商 AI 运营中控台，Monorepo 架构，包含前端、后端 API、任务队列和共享包。

## 项目结构

```
.
├── apps/
│   ├── web/          # React 19 + Vite + Tailwind CSS v4 前端 (端口 5000)
│   ├── api/          # NestJS 后端 API (端口 3001)
│   └── worker/       # BullMQ 任务队列
├── packages/
│   ├── shared/       # 共享类型、常量、Schema
│   ├── connectors/   # 平台连接器接口
│   └── config/       # ESLint/Prettier/TS 共享配置
├── prisma/           # Prisma Schema + 迁移 + Seed
├── docker/           # Docker Compose (PostgreSQL, Redis, MinIO)
└── .cozeproj/prototype/web/  # 原型 HTML 页面 (12+ 页面)
```

## 前端页面清单 (apps/web/src/pages/)

| 页面 | 文件 | 路由 | 说明 |
|------|------|------|------|
| 登录 | LoginPage.tsx | /login | 登录页面 |
| 总览 | OverviewPage.tsx | /overview | 指标卡、运营卡片、数据榜单 |
| 订单 | OrdersPage.tsx | /commerce/orders | 订单表格、AI建议、状态筛选 |
| 商品 | ProductsPage.tsx | /commerce/products | 商品列表、库存管理、AI优化 |
| 消息 | MessagesPage.tsx | /commerce/messages | 消息列表、AI回复草稿、审批 |
| 获客中心 | AcquisitionPage.tsx | /acquisition | 渠道分析、客户画像、漏斗 |
| 运营中心 | MediaPage.tsx | /media/center | 内容日历、素材管理 |
| 图像视频生成 | MediaCreativePage.tsx | /media/creative | AI生成创意内容 |
| 草稿审核 | MediaDraftsPage.tsx | /media/drafts | 草稿审核、合规检查 |
| 自动化 | AutomationPage.tsx | /media/automation | 自动化工作流管理 |
| 账号管理 | SettingsAccountsPage.tsx | /settings/accounts | 平台账号连接管理 |
| AI模型设置 | SettingsAIModelsPage.tsx | /settings/ai-models | AI模型配置与测试 |
| 自动托管 | SettingsAutopilotPage.tsx | /settings/autopilot | 自动托管模式配置 |
| 审批 | SettingsApprovalPage.tsx | /settings/approval | 审批流程配置 |
| 订阅账单 | SettingsBillingPage.tsx | /settings/billing | 订阅计划与账单 |

## 构建和启动命令

### 基础设施
```bash
# PostgreSQL (本地安装)
pg_ctlcluster 16 main start
# Redis (本地安装)
redis-server --daemonize yes --port 6379
```

### 一键启动
```bash
bash start.sh
```

### 单独启动
```bash
pnpm install                                 # 安装依赖
pnpm --filter @ai-commerce-ops/shared build  # 构建共享包
pnpm --filter @ai-commerce-ops/connectors build
pnpm --filter api build                      # 构建 API
pnpm --filter api dev                        # 启动 API (开发模式)

DATABASE_URL=postgresql://dev:dev@localhost:5432/ai_commerce_ops npx prisma migrate deploy  # 数据库迁移
DATABASE_URL=postgresql://dev:dev@localhost:5432/ai_commerce_ops npx tsx prisma/seed.ts       # 种子数据

pnpm --filter web dev     # 启动 Web 前端 (端口 5000)
pnpm --filter worker dev  # 启动 Worker
```

### 代码检查
```bash
pnpm --filter web typecheck   # TypeScript 类型检查
pnpm --filter web lint        # ESLint 检查
pnpm --filter web build       # 生产构建
```

## 技术栈

- **前端**: React 19 + Vite + Tailwind CSS v4 + React Router v6
- **后端**: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- **UI设计**: Material Design 3 色彩体系，Inter + Noto Sans SC 字体
- **图标**: Lucide React
- **Monorepo**: pnpm workspaces + Turborepo

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://dev:dev@localhost:5432/ai_commerce_ops` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |
| `PORT` | API 端口 | `3001` |
| `JWT_SECRET` | JWT 密钥 (≥32字符) | - |
| `CREDENTIAL_ENCRYPTION_KEY` | 凭据加密密钥 (64字符) | - |
| `S3_BUCKET` | S3 存储桶 | - |
| `S3_ENDPOINT` | S3 端点 | - |
| `VITE_API_BASE_URL` | 前端 API 地址 | `/api` |

## 代码风格

- TypeScript strict mode
- ESM (type: module)
- Workspace 包引用: `@ai-commerce-ops/shared`, `@ai-commerce-ops/connectors`, `@ai-commerce-ops/config`
- Prisma Client: `@prisma/client`
- Tailwind CSS v4 (使用 @theme 定义设计令牌)
- 组件导出使用命名导出: `export function ComponentName()`

## 已知问题

- `pnpm --filter api dev` (nest start --watch) 存在 TS 路径解析问题，需用 `node dist/main.js` 运行构建产物
- Prisma 迁移 SQL 文件含 BOM 字符，已修复
- 沙箱环境无 Redis，全栈启动需跳过 Redis 检查

## 端口分配

| 服务 | 端口 |
|------|------|
| Web 前端 (Vite) | 5000 |
| API (NestJS) | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
