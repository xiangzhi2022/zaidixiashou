# AI Commerce Ops Dashboard

跨境电商 AI 运营中控台，Monorepo 架构，包含前端、后端 API、任务队列和共享包。

## 项目结构

```
.
├── apps/
│   ├── web/          # React + Vite 前端 (端口 5000)
│   ├── api/          # NestJS 后端 API (端口 3001)
│   └── worker/       # BullMQ 任务队列
├── packages/
│   ├── shared/       # 共享类型、常量、Schema
│   ├── connectors/   # 平台连接器接口
│   └── config/       # ESLint/Prettier/TS 共享配置
├── prisma/           # Prisma Schema + 迁移 + Seed
├── docker/           # Docker Compose (PostgreSQL, Redis, MinIO)
├── index.html        # 静态原型 (参考)
├── styles.css        # 静态原型样式
└── app.js            # 静态原型逻辑 (12个页面)
```

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
pnpm --filter api dev                        # 启动 API (开发模式，需 TS 路径修复)
# 或直接运行构建产物: cd apps/api && node dist/main.js

DATABASE_URL=postgresql://dev:dev@localhost:5432/ai_commerce_ops npx prisma migrate deploy  # 数据库迁移
DATABASE_URL=postgresql://dev:dev@localhost:5432/ai_commerce_ops npx tsx prisma/seed.ts       # 种子数据

pnpm --filter web dev     # 启动 Web 前端 (端口 5000)
pnpm --filter worker dev  # 启动 Worker
```

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

## 已知问题

- `pnpm --filter api dev` (nest start --watch) 存在 TS 路径解析问题，需用 `node dist/main.js` 运行构建产物
- Prisma 迁移 SQL 文件含 BOM 字符，已修复

## 端口分配

| 服务 | 端口 |
|------|------|
| Web 前端 (Vite) | 5000 |
| API (NestJS) | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
