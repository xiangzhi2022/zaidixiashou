# AI Commerce Ops Dashboard — 工程框架方案与开发标准

> 版本：v1.0 · 日期：2026-04-30
> 本文档是所有开发工作的唯一启动参考，综合了 PRD v0.1 与工程架构 v1.0，提供可直接落地的规范、目录结构、数据模型与里程碑任务分解。

---

## 目录

1. [系统定位与核心原则](#1-系统定位与核心原则)
2. [技术栈最终决策](#2-技术栈最终决策)
3. [Monorepo 目录结构](#3-monorepo-目录结构)
4. [工程规范](#4-工程规范)
5. [前端架构标准](#5-前端架构标准)
6. [后端架构标准](#6-后端架构标准)
7. [数据库模型（Prisma Schema）](#7-数据库模型prisma-schema)
8. [API 设计规范](#8-api-设计规范)
9. [状态机定义](#9-状态机定义)
10. [连接器层设计](#10-连接器层设计)
11. [安全与风控标准](#11-安全与风控标准)
12. [队列与异步任务](#12-队列与异步任务)
13. [测试策略](#13-测试策略)
14. [CI/CD 与部署](#14-cicd-与部署)
15. [开发里程碑任务分解](#15-开发里程碑任务分解)

---

## 1. 系统定位与核心原则

### 1.1 产品定位

AI Commerce Ops Dashboard 是跨境电商团队的一体化运营中控台，覆盖三大模块：

| 模块 | 核心能力 |
|------|----------|
| 电商运营 | 跨平台订单、商品、库存、消息、售后处理 |
| 媒体运营 | 账号矩阵、图文视频生成、草稿审核发布、互动数据 |
| 系统设置 | 平台授权、自动托管边界、审批与风控 |

### 1.2 核心架构原则（不可违背）

**原则一：动作流（Action Flow）是一切的核心**

所有外部操作必须经过统一的动作流，无例外：

```
用户/AI 发起动作
  → 风控规则判断 (risk_rules)
  → requiresApproval=true? → 进入审批队列
  → 审批通过 → 写入 platform_actions (queued)
  → BullMQ Worker 消费 → 调用 Connector
  → 结果写回 connector_runs
  → 更新状态 → 写入 audit_logs
  → 前端 WebSocket/轮询 更新 UI
```

**原则二：安全底线**

- 高风险动作（发布、退款、改价、批量操作）**永远**进入审批，代码层禁止绕过。
- 平台凭证只存在于 `platform_credentials` 表，加密后存储，后端服务通过服务间调用获取，绝不透传前端。
- 审计日志 (`audit_logs`) 只允许 INSERT，禁止 UPDATE/DELETE，通过数据库触发器强制。

**原则三：状态机驱动，而非 if-else 堆砌**

草稿、审批、账号、动作的每个状态流转必须通过服务端状态机管理，前端只负责展示当前状态。

---

## 2. 技术栈最终决策

MVP 阶段技术栈已锁定，不再讨论替代方案：

### 2.1 前端

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | React 19 + TypeScript 5.4 | 无 SSR 需求，Vite 构建 |
| 构建 | Vite 5 | 替代 Next.js，减少早期服务端压力 |
| UI 组件 | shadcn/ui + Radix UI | 组件基础，深度定制 |
| 样式 | TailwindCSS 3 | 工具类优先，与 shadcn 配合 |
| 表格 | TanStack Table v8 | 服务端排序/分页 |
| 数据请求 | TanStack Query v5 | 缓存、重试、乐观更新 |
| 状态管理 | Zustand 4 | 轻量全局状态 |
| 表单 | React Hook Form + Zod | 统一校验 |
| 图标 | Lucide React | 与 shadcn 一致 |
| 实时 | Socket.io Client | 任务状态推送 |
| 路由 | React Router v6 | 声明式路由 |

### 2.2 后端

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | NestJS 10 + TypeScript 5.4 | 模块化、DI、装饰器驱动 |
| ORM | Prisma 5 | 类型安全、迁移管理 |
| 数据库 | PostgreSQL 16 | 业务主库 |
| 缓存/队列 | Redis 7 + BullMQ 5 | 队列调度、分布式锁、限流 |
| 对象存储 | S3 兼容 (MinIO 开发 / R2 生产) | 图片、视频、素材 |
| 实时 | Socket.io (nestjs/websockets) | 任务状态推送 |
| AI 主调 | Anthropic SDK / OpenAI SDK | LLM 文案生成 |
| Worker | Python 3.11 + Playwright | 浏览器自动化隔离 |
| 文档 | @nestjs/swagger + OpenAPI 3 | 自动 API 文档 |

### 2.3 基础设施

| 类别 | 选型 |
|------|------|
| 容器化 | Docker Compose (开发) |
| 环境分层 | local / dev / staging / production |
| 密钥管理 | 环境变量 + 生产环境 KMS（AWS KMS / 阿里云 KMS） |
| 日志 | Winston + Pino（结构化 JSON 日志） |
| 包管理 | pnpm workspace（Monorepo） |

---

## 3. Monorepo 目录结构

```
ai-commerce-ops/
├── apps/
│   ├── web/                          # React + Vite 前端
│   │   ├── src/
│   │   │   ├── app/                  # 路由、全局 Provider
│   │   │   ├── pages/                # 页面组件（与路由 1:1）
│   │   │   │   ├── overview/
│   │   │   │   ├── commerce/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── products/
│   │   │   │   │   └── messages/
│   │   │   │   ├── media/
│   │   │   │   │   ├── center/
│   │   │   │   │   ├── creative/
│   │   │   │   │   ├── drafts/
│   │   │   │   │   └── automation/
│   │   │   │   └── settings/
│   │   │   │       ├── accounts/
│   │   │   │       ├── autopilot/
│   │   │   │       └── approval/
│   │   │   ├── components/
│   │   │   │   ├── layout/           # AppShell, Sidebar, Topbar, CommandCenter
│   │   │   │   ├── common/           # MetricCard, DataTable, StatusPill ...
│   │   │   │   └── business/         # OrderTable, DraftReviewPublisher ...
│   │   │   ├── hooks/                # useOrders, useDrafts, useApprovals ...
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── api/                  # API client, query keys, mutations
│   │   │   ├── lib/                  # utils, formatters, constants
│   │   │   └── types/                # 前端类型（从 @shared 导入为主）
│   │   ├── public/
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   ├── api/                          # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # 登录、JWT、权限守卫
│   │   │   │   ├── users/            # 用户、团队、成员
│   │   │   │   ├── platform-accounts/# 平台账号授权
│   │   │   │   ├── commerce/         # 订单、商品、库存、消息
│   │   │   │   ├── media/            # 媒体账号、指标、草稿
│   │   │   │   ├── creative/         # AI 文案、图像、脚本生成
│   │   │   │   ├── approvals/        # 审批队列与风控
│   │   │   │   ├── automations/      # 定时任务、触发器
│   │   │   │   ├── connectors/       # 连接器注册与调度
│   │   │   │   ├── ai-command/       # AI 指挥台 NLP 处理
│   │   │   │   └── audit/            # 审计日志（只写）
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── guards/           # JwtGuard, RbacGuard, ApprovalGuard
│   │   │   │   ├── interceptors/     # ResponseInterceptor, LoggingInterceptor
│   │   │   │   ├── filters/          # GlobalExceptionFilter
│   │   │   │   └── pipes/            # ZodValidationPipe
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma/           # PrismaService
│   │   │   │   ├── redis/            # RedisService
│   │   │   │   ├── queue/            # BullMQ 定义
│   │   │   │   ├── storage/          # S3Service
│   │   │   │   └── crypto/           # 凭证加解密
│   │   │   └── config/               # 环境配置
│   │   └── test/
│   │
│   └── worker/                       # BullMQ 消费者 + Python Worker 入口
│       ├── src/
│       │   ├── processors/           # 各队列 Processor
│       │   └── python-bridge/        # 调用 Python Worker 的 HTTP/IPC 层
│       └── python/
│           ├── playwright_runner.py  # 浏览器自动化沙箱
│           └── media_processor.py    # 图像/视频处理
│
├── packages/
│   ├── shared/                       # 核心共享包（前后端共用）
│   │   ├── src/
│   │   │   ├── types/                # 所有 TS 类型定义
│   │   │   ├── schemas/              # Zod schema（请求/响应校验）
│   │   │   ├── constants/            # 枚举、错误码、平台列表
│   │   │   └── state-machines/       # 状态机定义（xstate 或纯枚举）
│   │   └── package.json
│   │
│   ├── ui/                           # 前端通用组件库（可独立发布）
│   ├── connectors/                   # 平台连接器抽象与实现
│   │   ├── src/
│   │   │   ├── base/                 # PlatformConnector 接口
│   │   │   ├── shopify/
│   │   │   ├── amazon/
│   │   │   ├── ebay/
│   │   │   ├── instagram/
│   │   │   ├── tiktok/
│   │   │   └── xiaohongshu/
│   │   └── package.json
│   │
│   ├── ai-agents/                    # AI Prompt、Agent、结构化输出 Schema
│   └── config/                       # 共享 ESLint、TSConfig、Prettier
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker/
│   ├── docker-compose.yml            # 本地全栈
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
│
├── docs/
│   ├── adr/                          # 架构决策记录
│   └── api/                          # OpenAPI 导出
│
├── pnpm-workspace.yaml
├── package.json
└── turbo.json                        # Turborepo 任务编排
```

---

## 4. 工程规范

### 4.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件（组件） | PascalCase | `OrderTable.tsx` |
| 文件（工具/钩子） | camelCase | `useOrders.ts`, `formatDate.ts` |
| 文件（后端模块） | kebab-case | `platform-accounts.service.ts` |
| React 组件 | PascalCase | `DraftReviewPublisher` |
| Hook | `use` 前缀 | `useApprovalQueue` |
| Store | `use` + `Store` 后缀 | `useAuthStore` |
| API 路由 | REST 复数资源 | `/api/media/drafts/:id` |
| 数据库表 | snake_case 复数 | `platform_accounts`, `media_drafts` |
| 枚举值 | SCREAMING_SNAKE_CASE | `APPROVAL_REQUIRED` |
| 环境变量 | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

### 4.2 TypeScript 规范

```typescript
// ✅ 强制：所有函数参数和返回值必须有明确类型
async function createDraft(dto: CreateDraftDto): Promise<DraftEntity> {}

// ✅ 强制：使用 Zod 定义请求 Schema，从中推导 TS 类型
const CreateDraftSchema = z.object({
  platform: z.enum(['xiaohongshu', 'tiktok', 'instagram']),
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});
type CreateDraftDto = z.infer<typeof CreateDraftSchema>;

// ✅ 强制：使用 discriminated union 建模状态
type DraftStatus =
  | { status: 'draft' }
  | { status: 'pending_review'; submittedAt: string }
  | { status: 'approved'; approvedBy: string }
  | { status: 'published'; publishedAt: string; postId: string }
  | { status: 'publish_failed'; reason: string; retryable: boolean };

// ❌ 禁止：any 类型（配置 noImplicitAny: true，strict: true）
function process(data: any) {} // 不允许

// ❌ 禁止：非空断言（除非有充分注释）
const value = map.get(key)!; // 避免，改用提前检查
```

### 4.3 Git 工作流

```
main          ← 生产环境，受保护，只接受 PR
  └── develop ← 集成分支，CI 自动部署到 staging
        ├── feat/m1-sidebar-routing
        ├── feat/m2-approval-queue
        ├── fix/draft-status-update
        └── chore/prisma-migration-add-risk-rules
```

**Commit 格式（Conventional Commits）：**

```
feat(media): add draft submit-review endpoint
fix(auth): handle token refresh race condition
chore(prisma): add draft_versions migration
docs(api): update approval endpoint schema
test(connectors): add shopify mock connector unit tests
```

### 4.4 环境变量规范

每个 `app` 目录维护自己的 `.env.example`，所有环境变量在 `config/` 中通过 `@nestjs/config` 校验：

```typescript
// apps/api/src/config/env.validation.ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CREDENTIAL_ENCRYPTION_KEY: z.string().length(64), // AES-256 hex key
  S3_BUCKET: z.string(),
  S3_ENDPOINT: z.string().url(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
});
```

---

## 5. 前端架构标准

### 5.1 页面路由映射

```typescript
// apps/web/src/app/router.tsx
const routes = [
  { path: '/',                   element: <Navigate to="/overview" /> },
  { path: '/overview',           element: <OverviewPage /> },
  { path: '/commerce/orders',    element: <OrdersPage /> },
  { path: '/commerce/products',  element: <ProductsPage /> },
  { path: '/commerce/messages',  element: <MessagesPage /> },
  { path: '/media/center',       element: <MediaCenterPage /> },
  { path: '/media/creative',     element: <CreativePage /> },
  { path: '/media/drafts',       element: <DraftsPage /> },
  { path: '/media/automation',   element: <AutomationPage /> },
  { path: '/settings/accounts',  element: <AccountsPage /> },
  { path: '/settings/autopilot', element: <AutopilotPage /> },
  { path: '/settings/approval',  element: <ApprovalPage /> },
];
```

### 5.2 API Client 层

所有接口调用必须通过统一的 `apiClient`，禁止在组件中直接使用 `fetch`：

```typescript
// apps/web/src/api/client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 30_000,
    });

    // 请求拦截：注入 JWT Token
    this.instance.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // 响应拦截：统一错误处理 + 401 自动刷新
    this.instance.interceptors.response.use(
      (res) => res.data.data,          // 解包 { ok, data, error }
      async (error) => {
        if (error.response?.status === 401) {
          await useAuthStore.getState().refreshToken();
          return this.instance.request(error.config);
        }
        const apiError = error.response?.data?.error;
        throw new ApiError(apiError?.code, apiError?.message);
      }
    );
  }

  get = <T>(url: string, params?: object) =>
    this.instance.get<T>(url, { params });
  post = <T>(url: string, data?: object, headers?: object) =>
    this.instance.post<T>(url, data, { headers });
  patch = <T>(url: string, data?: object) =>
    this.instance.patch<T>(url, data);
  delete = <T>(url: string) => this.instance.delete<T>(url);
}

export const apiClient = new ApiClient();
```

### 5.3 TanStack Query 规范

```typescript
// apps/web/src/api/query-keys.ts — 集中管理 Query Key
export const queryKeys = {
  drafts: {
    all: ['drafts'] as const,
    list: (filters: DraftFilters) => ['drafts', 'list', filters] as const,
    detail: (id: string) => ['drafts', 'detail', id] as const,
  },
  approvals: {
    queue: (status?: ApprovalStatus) => ['approvals', status ?? 'pending'] as const,
  },
  commerce: {
    orders: (filters: OrderFilters) => ['commerce', 'orders', filters] as const,
  },
} as const;

// apps/web/src/hooks/useDrafts.ts — 业务 Hook 封装
export function useDrafts(filters: DraftFilters) {
  return useQuery({
    queryKey: queryKeys.drafts.list(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Draft>>('/media/drafts', filters),
    staleTime: 30_000,
  });
}

export function useSubmitDraftReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      apiClient.post(`/media/drafts/${draftId}/submit-review`),
    onSuccess: (_, draftId) => {
      // 乐观更新 + 失效相关 Query
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}
```

### 5.4 Zustand Store 规范

```typescript
// apps/web/src/stores/auth.store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: Permission[];
  // Actions
  setAuth: (user: User, token: string, permissions: Permission[]) => void;
  refreshToken: () => Promise<void>;
  logout: () => void;
  // Selectors（计算属性）
  hasPermission: (action: string) => boolean;
  canApprove: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      permissions: [],
      setAuth: (user, accessToken, permissions) =>
        set({ user, accessToken, permissions }),
      hasPermission: (action) =>
        get().permissions.some((p) => p.action === action),
      canApprove: () =>
        ['reviewer', 'admin', 'owner'].includes(get().user?.role ?? ''),
      logout: () => set({ user: null, accessToken: null, permissions: [] }),
      refreshToken: async () => { /* ... */ },
    }),
    { name: 'auth-storage', partialize: (s) => ({ accessToken: s.accessToken }) }
  )
);
```

### 5.5 组件状态完整性标准

所有异步数据展示组件，必须覆盖以下 6 种状态，不允许遗漏：

```typescript
// 模板：每个列表/详情页都必须处理
function OrdersPage() {
  const { data, isLoading, isError, error, isFetching } = useOrders(filters);

  if (isLoading) return <PageSkeleton />; // ① 首次加载骨架屏

  if (isError) {
    if (error.code === 'AUTH_EXPIRED') return <TokenExpiredBanner />; // ② 授权失效阻断
    if (error.code === 'APPROVAL_REQUIRED') return <ApprovalRequiredBanner />; // ③ 需要审批
    return <ErrorState message={error.message} onRetry={refetch} />;         // ④ 通用错误+重试
  }

  if (!data?.items.length) return <EmptyState />;                            // ⑤ 空状态

  return (
    <>
      {isFetching && <RefetchingIndicator />}                                 {/* ⑥ 后台刷新 */}
      <DataTable data={data.items} columns={columns} />
    </>
  );
}
```

### 5.6 高风险操作 UI 规范

所有 `riskLevel === 'high'` 的操作按钮，必须：
1. 显示红色警告标识（`⚠️ 高风险`）。
2. 点击后弹出二次确认 Dialog，说明影响范围。
3. 提交时携带 `Idempotency-Key`（UUID v4）。
4. 账号 Token 过期时，按钮 `disabled`，并显示「账号授权已过期，请前往设置重新授权」。

```typescript
// components/common/RiskActionButton.tsx
interface RiskActionButtonProps {
  label: string;
  riskLevel: 'low' | 'medium' | 'high';
  accountStatus: AccountStatus;
  onConfirm: (idempotencyKey: string) => void;
  children?: React.ReactNode;
}
```

---

## 6. 后端架构标准

### 6.1 NestJS 模块结构规范

每个业务模块必须遵循以下结构：

```
modules/media/
├── media.module.ts               # Module 注册
├── media.controller.ts           # HTTP 入口（只做参数提取与响应）
├── media.service.ts              # 业务逻辑（唯一的业务代码位置）
├── media-drafts.service.ts       # 草稿子领域服务
├── dto/
│   ├── create-draft.dto.ts       # Zod Schema + 推导类型
│   └── update-draft.dto.ts
├── entities/
│   └── draft.entity.ts           # Prisma 返回类型包装（可选）
└── __tests__/
    ├── media.service.spec.ts
    └── media.controller.spec.ts
```

### 6.2 Controller 规范

Controller 职责仅限于：提取参数 → 调用 Service → 返回。不写业务逻辑。

```typescript
@Controller('media/drafts')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MediaDraftsController {
  constructor(private readonly draftsService: MediaDraftsService) {}

  @Get()
  @Roles('operator', 'admin', 'owner')
  async listDrafts(
    @TeamId() teamId: string,
    @Query() query: ListDraftsQuery,
  ): Promise<PaginatedResponse<DraftDto>> {
    return this.draftsService.list(teamId, query);
  }

  @Post(':id/submit-review')
  @Roles('operator', 'admin', 'owner')
  async submitReview(
    @TeamId() teamId: string,
    @Param('id') draftId: string,
    @UserId() userId: string,
  ): Promise<DraftDto> {
    return this.draftsService.submitReview(teamId, draftId, userId);
  }
}
```

### 6.3 Service 规范

```typescript
@Injectable()
export class MediaDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalsService,
    private readonly auditService: AuditService,
    @InjectQueue('media.publish') private readonly publishQueue: Queue,
  ) {}

  async submitReview(teamId: string, draftId: string, userId: string): Promise<DraftDto> {
    const draft = await this.prisma.mediaDraft.findFirstOrThrow({
      where: { id: draftId, teamId, status: 'draft' }, // 状态前置校验
    });

    // 状态机转换：draft → pending_review
    const updated = await this.prisma.mediaDraft.update({
      where: { id: draftId },
      data: { status: 'pending_review', submittedAt: new Date(), submittedBy: userId },
    });

    // 如果 risk_level 为 high，自动创建审批
    if (draft.riskLevel === 'high' || draft.riskLevel === 'medium') {
      await this.approvalService.create({
        teamId,
        actionType: 'media.publish',
        targetId: draftId,
        riskLevel: draft.riskLevel,
        createdBy: userId,
        reason: '内容发布需要人工审批',
        payloadSnapshot: draft,
      });
    }

    await this.auditService.log({
      teamId, userId, actionType: 'draft.submit_review',
      targetId: draftId, result: 'success',
    });

    return DraftDto.from(updated);
  }
}
```

### 6.4 响应格式（全局 ResponseInterceptor）

```typescript
// common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    const requestId = context.switchToHttp().getRequest().headers['x-request-id']
      ?? randomUUID();
    return next.handle().pipe(
      map((data) => ({ ok: true, data, error: null, requestId })),
    );
  }
}

// common/filters/global-exception.filter.ts — 统一错误响应
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (exception instanceof ApiException) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') { status = 404; code = 'NOT_FOUND'; }
    }

    res.status(status).json({
      ok: false, data: null, requestId: req.headers['x-request-id'],
      error: { code, message },
    });
  }
}
```

### 6.5 RBAC 实现规范

```typescript
// 角色层级（从低到高）
export enum UserRole {
  VIEWER    = 'viewer',
  OPERATOR  = 'operator',
  REVIEWER  = 'reviewer',
  DEVELOPER = 'developer',
  ADMIN     = 'admin',
  OWNER     = 'owner',
}

// 权限矩阵（部分示例）
export const PERMISSIONS = {
  'draft.create':          [Role.OPERATOR, Role.ADMIN, Role.OWNER],
  'draft.submit_review':   [Role.OPERATOR, Role.ADMIN, Role.OWNER],
  'approval.approve':      [Role.REVIEWER, Role.ADMIN, Role.OWNER],
  'platform_action.high':  [Role.ADMIN, Role.OWNER],
  'automation.toggle':     [Role.ADMIN, Role.OWNER],
  'credentials.read':      [],  // 任何角色都不能通过 API 读取原始凭证
} as const;

// 审批互斥规则：发起人不能是自己内容的审批人
// 在 ApprovalsService.approve() 中校验：
// if (approval.createdBy === currentUserId) throw new ApiException('SELF_APPROVAL_NOT_ALLOWED');
```

---

## 7. 数据库模型（Prisma Schema）

### 7.1 核心 Schema（关键表）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 用户与团队 ───────────────────────────────────────

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String
  passwordHash String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  teamMembers  TeamMember[]
}

model Team {
  id          String       @id @default(cuid())
  name        String
  autopilotLevel AutopilotLevel @default(DRAFT_ONLY)
  createdAt   DateTime     @default(now())
  members     TeamMember[]
  platformAccounts PlatformAccount[]
  mediaDrafts MediaDraft[]
}

model TeamMember {
  id        String    @id @default(cuid())
  teamId    String
  userId    String
  role      UserRole  @default(OPERATOR)
  team      Team      @relation(fields: [teamId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  @@unique([teamId, userId])
}

enum UserRole {
  VIEWER
  OPERATOR
  REVIEWER
  DEVELOPER
  ADMIN
  OWNER
}

enum AutopilotLevel {
  OFF
  DRAFT_ONLY
  SEMI_AUTO
  FULL_AUTO
}

// ─── 平台账号 ──────────────────────────────────────────

model PlatformAccount {
  id           String        @id @default(cuid())
  teamId       String
  platform     Platform
  displayName  String
  status       AccountStatus @default(NOT_CONNECTED)
  authType     AuthType
  scopes       String[]
  expiresAt    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  team         Team          @relation(fields: [teamId], references: [id])
  credentials  PlatformCredential?
  platformActions PlatformAction[]
}

// 凭证独立表，AES-256 加密存储
model PlatformCredential {
  id                String          @id @default(cuid())
  accountId         String          @unique
  encryptedPayload  String          // AES-256-GCM 加密的 JSON
  iv                String          // 初始化向量（hex）
  keyVersion        Int             @default(1)
  updatedAt         DateTime        @updatedAt
  account           PlatformAccount @relation(fields: [accountId], references: [id])
}

enum Platform {
  AMAZON EBAY SHOPIFY TIKTOK_SHOP MERCADOLIBRE
  XIAOHONGSHU DOUYIN TIKTOK INSTAGRAM TWITTER
}

enum AccountStatus {
  NOT_CONNECTED CONNECTING CONNECTED TOKEN_EXPIRING EXPIRED RECONNECT_REQUIRED DISCONNECTED
}

enum AuthType {
  OAUTH API_KEY COOKIE MCP_STDIO OPENAPI
}

// ─── 统一动作表（Action Flow 核心）────────────────────

model PlatformAction {
  id               String        @id @default(cuid())
  teamId           String
  accountId        String
  actionType       String        // e.g. "media.publish", "commerce.refund"
  riskLevel        RiskLevel
  requiresApproval Boolean
  status           ActionStatus  @default(DRAFT)
  payload          Json
  idempotencyKey   String        @unique
  createdAt        DateTime      @default(now())
  executedAt       DateTime?
  account          PlatformAccount @relation(fields: [accountId], references: [id])
  connectorRuns    ConnectorRun[]
  approvalRequest  ApprovalRequest?
}

enum RiskLevel { LOW MEDIUM HIGH }

enum ActionStatus {
  DRAFT PENDING_APPROVAL APPROVED QUEUED RUNNING SUCCEEDED FAILED CANCELED
}

// ─── 连接器执行记录 ────────────────────────────────────

model ConnectorRun {
  id                      String        @id @default(cuid())
  actionId                String
  connectorName           String
  requestPayloadSnapshot  Json
  responsePayloadSnapshot Json?
  status                  RunStatus
  errorMessage            String?
  latencyMs               Int?
  createdAt               DateTime      @default(now())
  action                  PlatformAction @relation(fields: [actionId], references: [id])
}

enum RunStatus { RUNNING SUCCEEDED FAILED }

// ─── 风控规则表 ────────────────────────────────────────

model RiskRule {
  id               String    @id @default(cuid())
  teamId           String?   // null = 全局规则
  actionType       String
  platform         Platform?
  conditionJson    Json      // 规则条件（灵活配置）
  riskLevel        RiskLevel
  requiresApproval Boolean
  isActive         Boolean   @default(true)
  createdAt        DateTime  @default(now())
}

// ─── 草稿与版本 ────────────────────────────────────────

model MediaDraft {
  id          String      @id @default(cuid())
  teamId      String
  platform    Platform
  title       String
  body        String
  status      DraftStatus @default(DRAFT)
  riskLevel   RiskLevel   @default(MEDIUM)
  scheduledAt DateTime?
  submittedAt DateTime?
  submittedBy String?
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  team        Team        @relation(fields: [teamId], references: [id])
  versions    DraftVersion[]
  assets      MediaAsset[]
  approvalRequest ApprovalRequest?
}

model DraftVersion {
  id              String     @id @default(cuid())
  draftId         String
  version         Int
  body            String
  assetsSnapshot  Json
  createdAt       DateTime   @default(now())
  draft           MediaDraft @relation(fields: [draftId], references: [id])
  @@unique([draftId, version])
}

enum DraftStatus {
  DRAFT PENDING_REVIEW APPROVED SCHEDULED PUBLISHING PUBLISHED PUBLISH_FAILED
}

// ─── 审批 ──────────────────────────────────────────────

model ApprovalRequest {
  id              String           @id @default(cuid())
  teamId          String
  actionType      String
  targetId        String
  riskLevel       RiskLevel
  status          ApprovalStatus   @default(PENDING)
  createdBy       String           // "ai" 或 userId
  reason          String
  payloadSnapshot Json
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNote      String?
  expiresAt       DateTime?
  createdAt       DateTime         @default(now())
  action          PlatformAction?  @relation(fields: [targetId], references: [id])
  draft           MediaDraft?      @relation(fields: [targetId], references: [id])
}

enum ApprovalStatus { PENDING APPROVED REJECTED CHANGE_REQUESTED EXPIRED }

// ─── 审计日志（只允许 INSERT）─────────────────────────

model AuditLog {
  id          String   @id @default(cuid())
  teamId      String
  userId      String?
  actionType  String
  targetId    String?
  platform    Platform?
  riskLevel   RiskLevel?
  result      String   // "success" | "failure"
  errorCode   String?
  latencyMs   Int?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([teamId, createdAt])
  @@index([actionType, createdAt])
}

// ─── AI 计划表 ─────────────────────────────────────────

model AiPlan {
  id        String       @id @default(cuid())
  teamId    String
  prompt    String
  status    AiPlanStatus @default(PENDING)
  createdAt DateTime     @default(now())
  steps     AiPlanStep[]
}

model AiPlanStep {
  id          String   @id @default(cuid())
  planId      String
  stepOrder   Int
  actionType  String
  description String
  payload     Json
  status      ActionStatus @default(DRAFT)
  plan        AiPlan   @relation(fields: [planId], references: [id])
}

enum AiPlanStatus { PENDING CONFIRMED EXECUTING COMPLETED CANCELED }
```

### 7.2 数据库索引规范

```sql
-- 高频查询必须有索引
CREATE INDEX idx_platform_actions_team_status ON platform_actions(team_id, status);
CREATE INDEX idx_media_drafts_team_status ON media_drafts(team_id, status);
CREATE INDEX idx_approval_requests_team_status ON approval_requests(team_id, status);
CREATE INDEX idx_connector_runs_action_id ON connector_runs(action_id);

-- 审计日志禁止物理删除（PostgreSQL Row-Level Security）
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_logs FOR INSERT TO api_user WITH CHECK (true);
-- 禁止 UPDATE 和 DELETE（不创建对应 Policy）
```

---

## 8. API 设计规范

### 8.1 标准响应格式

```typescript
// packages/shared/src/types/api.ts

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: ApiError | null;
  requestId: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
```

### 8.2 全局错误码枚举

```typescript
// packages/shared/src/constants/error-codes.ts
export const ErrorCodes = {
  // 认证
  UNAUTHORIZED:               'UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED:         'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_ROLE:     'AUTH_INSUFFICIENT_ROLE',
  SELF_APPROVAL_NOT_ALLOWED:  'SELF_APPROVAL_NOT_ALLOWED',
  // 资源
  NOT_FOUND:                  'NOT_FOUND',
  ALREADY_EXISTS:             'ALREADY_EXISTS',
  // 平台
  PLATFORM_AUTH_EXPIRED:      'PLATFORM_AUTH_EXPIRED',
  PLATFORM_RATE_LIMITED:      'PLATFORM_RATE_LIMITED',
  PLATFORM_CONNECTOR_ERROR:   'PLATFORM_CONNECTOR_ERROR',
  // 审批与风控
  APPROVAL_REQUIRED:          'APPROVAL_REQUIRED',
  APPROVAL_PENDING:           'APPROVAL_PENDING',
  ACTION_REJECTED:            'ACTION_REJECTED',
  // 幂等
  IDEMPOTENCY_CONFLICT:       'IDEMPOTENCY_CONFLICT',
  // 状态机
  INVALID_STATUS_TRANSITION:  'INVALID_STATUS_TRANSITION',
  // 系统
  INTERNAL_ERROR:             'INTERNAL_ERROR',
} as const;
```

### 8.3 幂等性规范

所有 POST 高风险动作（`riskLevel !== 'low'`）必须：

```typescript
// 前端：生成 UUID 并写入请求头
const idempotencyKey = crypto.randomUUID();
await apiClient.post(
  `/media/drafts/${draftId}/publish`,
  {},
  { 'Idempotency-Key': idempotencyKey }
);

// 后端：校验幂等键
async function checkIdempotency(key: string): Promise<PlatformAction | null> {
  const existing = await this.prisma.platformAction.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) {
    if (existing.status === 'SUCCEEDED') return existing; // 直接返回历史结果
    if (existing.status === 'RUNNING') throw new ApiException('IDEMPOTENCY_CONFLICT');
  }
  return null;
}
```

### 8.4 完整 API 端点清单

```
# 认证
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/me

# 平台账号
GET    /api/platform-accounts
POST   /api/platform-accounts/:platform/connect
POST   /api/platform-accounts/:id/refresh
DELETE /api/platform-accounts/:id

# 总览
GET    /api/dashboard/summary
GET    /api/dashboard/tasks

# 电商
GET    /api/commerce/orders              ?page&pageSize&platform&status&priority
GET    /api/commerce/orders/:id
POST   /api/commerce/orders/:id/ai-suggestion
GET    /api/commerce/products            ?page&pageSize&platform&stockStatus
GET    /api/commerce/messages            ?page&pageSize&platform&priority
POST   /api/commerce/messages/:id/generate-reply
POST   /api/commerce/messages/:id/submit-reply   [Idempotency-Key required]

# 媒体
GET    /api/media/accounts
GET    /api/media/metrics
GET    /api/media/leaderboard
GET    /api/media/engaged-users
POST   /api/media/creative/generate
POST   /api/media/drafts
GET    /api/media/drafts                 ?page&pageSize&status&platform
GET    /api/media/drafts/:id
PATCH  /api/media/drafts/:id
POST   /api/media/drafts/:id/submit-review
POST   /api/media/drafts/:id/publish     [Idempotency-Key required]
POST   /api/media/drafts/:id/retry       [Idempotency-Key required]

# 审批
GET    /api/approvals                    ?status&page&pageSize
GET    /api/approvals/:id
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject
POST   /api/approvals/:id/request-change

# 自动化
GET    /api/automations
POST   /api/automations
PATCH  /api/automations/:id
DELETE /api/automations/:id
POST   /api/automations/:id/toggle
POST   /api/automations/:id/run-now
GET    /api/automations/:id/runs

# AI 指挥台
POST   /api/ai/command
GET    /api/ai/plans/:id
POST   /api/ai/plans/:id/confirm
POST   /api/ai/plans/:id/cancel

# 审计日志（只读）
GET    /api/audit-logs                   ?teamId&actionType&from&to&page
```

---

## 9. 状态机定义

以下状态机定义为**服务端权威状态**，前端只展示，不自行推断允许的转换。

### 9.1 草稿状态机

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
         edit       ▼    submit_review                        │ change_requested
  ┌──── DRAFT ──────────────────────────► PENDING_REVIEW ─────┘
  │       ▲                                      │
  │       │ rejected                             │ approved
  │       │                                      ▼
  │       └──────────────────────────────── APPROVED
  │                                              │
  │                                  schedule /  │ publish_now
  │                                              ├──────────────► SCHEDULED
  │                                              │                     │
  │                                              │            time reached
  │                                              ▼                     │
  │                                         PUBLISHING ◄──────────────┘
  │                                              │
  │                              succeeded /     ├──────────────► PUBLISHED ✅
  │                               failed         │
  └──────────────────────────────────────────── PUBLISH_FAILED (retryable)
```

**允许的状态转换（服务端校验）：**

| 当前状态 | 动作 | 目标状态 |
|----------|------|----------|
| `DRAFT` | `submit_review` | `PENDING_REVIEW` |
| `PENDING_REVIEW` | `approve` | `APPROVED` |
| `PENDING_REVIEW` | `reject` | `DRAFT` |
| `PENDING_REVIEW` | `change_requested` | `DRAFT` |
| `APPROVED` | `schedule` | `SCHEDULED` |
| `APPROVED` / `SCHEDULED` | `publish` | `PUBLISHING` |
| `PUBLISHING` | `connector.success` | `PUBLISHED` |
| `PUBLISHING` | `connector.failure` | `PUBLISH_FAILED` |
| `PUBLISH_FAILED` | `retry` | `PUBLISHING` |

### 9.2 审批状态机

```
PENDING ──► APPROVED ✅
        ──► REJECTED ❌
        ──► CHANGE_REQUESTED → (修改后回到 PENDING_REVIEW)
        ──► EXPIRED (超时未处理)
```

### 9.3 平台动作状态机

```
DRAFT → PENDING_APPROVAL → APPROVED → QUEUED → RUNNING → SUCCEEDED ✅
                       ↘                              ↘→ FAILED (retryable)
                       REJECTED                       ↘→ CANCELED
```

### 9.4 账号状态机

```
NOT_CONNECTED → CONNECTING → CONNECTED → TOKEN_EXPIRING → EXPIRED → RECONNECT_REQUIRED
                    ↓                                                       ↓
                DISCONNECTED ◄──────────────────────────────────────────────┘
```

---

## 10. 连接器层设计

### 10.1 连接器接口定义

```typescript
// packages/connectors/src/base/connector.interface.ts

export interface HealthStatus {
  healthy: boolean;
  latencyMs: number;
  message?: string;
  tokenExpiresAt?: Date;
}

export interface Capability {
  name: string;
  available: boolean;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  description: string;
}

export interface PlatformConnector {
  readonly platform: Platform;
  readonly authType: AuthType;
  checkHealth(accountId: string): Promise<HealthStatus>;
  listCapabilities(): Promise<Capability[]>;
  execute(action: PlatformAction): Promise<PlatformResult>;
}

export interface PlatformResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; retryable: boolean };
  platformRequestId?: string;
}
```

### 10.2 连接器实现模板

```typescript
// packages/connectors/src/shopify/shopify.connector.ts
@Injectable()
export class ShopifyConnector implements PlatformConnector {
  readonly platform = Platform.SHOPIFY;
  readonly authType = AuthType.OAUTH;

  constructor(
    private readonly credentialService: CredentialService,
    private readonly httpService: HttpService,
  ) {}

  async checkHealth(accountId: string): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const creds = await this.credentialService.decrypt(accountId);
      await this.httpService.get(`${creds.shopUrl}/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': creds.accessToken },
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (e) {
      return { healthy: false, latencyMs: Date.now() - start, message: e.message };
    }
  }

  async execute(action: PlatformAction): Promise<PlatformResult> {
    switch (action.actionType) {
      case 'shopify.get_orders': return this.getOrders(action);
      case 'shopify.get_products': return this.getProducts(action);
      default:
        return { success: false, error: { code: 'UNSUPPORTED_ACTION', message: '', retryable: false } };
    }
  }
  // ...private methods
}
```

### 10.3 MVP 连接器接入优先级

| 连接器 | 类型 | MVP 范围 | 参考工具 |
|--------|------|----------|----------|
| Shopify Mock | 电商只读 | **必须** | `ShopifyMockMCP` |
| Amazon SP-API | 电商只读 | 次优先 | `amazon_sp_mcp` |
| eBay | 电商只读 | 次优先 | `ebay-mcp` |
| Instagram Graph API | 媒体只读 | **必须** | `instagram-analytics-mcp` |
| 小红书 | 媒体只读 | 谨慎接入 | `xiaohongshu-mcp` (本地浏览器) |
| TikTok | 媒体只读 | 后续 | `tiktok-uploader` |

---

## 11. 安全与风控标准

### 11.1 凭证加解密

```typescript
// apps/api/src/infrastructure/crypto/credential-crypto.service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CredentialCryptoService {
  private readonly KEY: Buffer;

  constructor(configService: ConfigService) {
    this.KEY = Buffer.from(configService.get('CREDENTIAL_ENCRYPTION_KEY'), 'hex');
  }

  encrypt(plaintext: string): { encrypted: string; iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      encrypted: Buffer.concat([encrypted, authTag]).toString('base64'),
      iv: iv.toString('hex'),
    };
  }

  decrypt(encrypted: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const data = Buffer.from(encrypted, 'base64');
    const authTag = data.slice(-16);
    const encData = data.slice(0, -16);
    const decipher = createDecipheriv('aes-256-gcm', this.KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encData), decipher.final()]).toString('utf8');
  }
}
```

### 11.2 Webhook 校验规范

```typescript
// 所有平台 Webhook 必须验签
function verifyShopifyWebhook(body: Buffer, signature: string, secret: string): boolean {
  const digest = createHmac('sha256', secret).update(body).digest('base64');
  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

### 11.3 高风险动作清单（代码级拦截）

以下 `actionType` 在 `ApprovalGuard` 中强制拦截，`requiresApproval` 不可被覆盖为 `false`：

```typescript
export const ALWAYS_REQUIRE_APPROVAL = new Set([
  'media.publish',
  'media.bulk_message',
  'commerce.refund',
  'commerce.price_update',
  'commerce.cancel_order',
  'commerce.bulk_listing_update',
  'commerce.bulk_order_operation',
  'media.delete_post',
]);
```

---

## 12. 队列与异步任务

### 12.1 队列清单

```typescript
// apps/api/src/infrastructure/queue/queues.ts
export const QUEUES = {
  SYNC_ORDERS:         'sync.orders',
  SYNC_PRODUCTS:       'sync.products',
  SYNC_MEDIA_METRICS:  'sync.mediaMetrics',
  AI_GENERATE_CREATIVE:'ai.generateCreative',
  AI_GENERATE_REPLY:   'ai.generateReply',
  MEDIA_PUBLISH:       'media.publish',
  APPROVAL_TIMEOUT:    'approval.timeout',
  AUTOMATION_RUN:      'automation.run',
  CONNECTOR_HEALTH:    'connector.healthCheck',
} as const;
```

### 12.2 Processor 规范

```typescript
// apps/worker/src/processors/media-publish.processor.ts
@Processor(QUEUES.MEDIA_PUBLISH)
export class MediaPublishProcessor {
  @Process()
  async handle(job: Job<MediaPublishJobData>) {
    const { actionId, draftId } = job.data;

    // 1. 更新状态为 RUNNING
    await this.prisma.platformAction.update({
      where: { id: actionId }, data: { status: 'RUNNING' },
    });

    // 2. 记录 connector_run 开始
    const runId = await this.connectorRunService.start(actionId, draftId);

    try {
      // 3. 调用连接器
      const result = await this.connectorService.execute(action);

      // 4. 成功：更新状态 + 写审计
      await this.connectorRunService.succeed(runId, result);
      await this.prisma.platformAction.update({
        where: { id: actionId }, data: { status: 'SUCCEEDED', executedAt: new Date() },
      });
      await this.auditService.log({ actionType: 'media.publish', result: 'success', ... });
    } catch (error) {
      // 5. 失败：记录错误，判断是否重试
      await this.connectorRunService.fail(runId, error.message);
      const shouldRetry = error.retryable && job.attemptsMade < 3;
      if (!shouldRetry) {
        await this.prisma.mediaDraft.update({
          where: { id: draftId }, data: { status: 'PUBLISH_FAILED' },
        });
      }
      throw error; // BullMQ 自动重试
    }
  }
}
```

### 12.3 重试策略

```typescript
// BullMQ 默认重试配置
const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 }, // 5s, 10s, 20s
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
```

---

## 13. 测试策略

### 13.1 测试分层

| 层级 | 工具 | 覆盖目标 | 覆盖率目标 |
|------|------|----------|------------|
| 单元测试 | Vitest (前端) / Jest (后端) | Service、状态机、工具函数 | 80%+ |
| 集成测试 | Jest + `@nestjs/testing` | Controller + Service + Prisma (测试 DB) | 关键流程 100% |
| E2E 测试 | Playwright | 核心用户流程（发布流程、审批流程） | 关键路径 |
| 连接器测试 | Jest + Mock | 连接器单元 Mock 测试 | 所有 execute 分支 |

### 13.2 关键测试用例（必须存在）

```typescript
// 状态机测试：不允许非法状态转换
it('should throw INVALID_STATUS_TRANSITION when submitting a published draft', async () => {
  const draft = await createDraftWithStatus('PUBLISHED');
  await expect(service.submitReview(draft.id)).rejects.toThrow('INVALID_STATUS_TRANSITION');
});

// 高风险动作拦截测试
it('should always require approval for media.publish regardless of autopilot level', async () => {
  const result = await service.executeAction({ actionType: 'media.publish', ... });
  expect(result.requiresApproval).toBe(true);
});

// 幂等键冲突测试
it('should return existing result on duplicate idempotency key', async () => {
  const key = 'idem-test-001';
  await service.publish({ idempotencyKey: key, ... });
  const result2 = await service.publish({ idempotencyKey: key, ... });
  expect(result2.idempotencyKey).toBe(key); // 返回原有记录，不重复执行
});
```

---

## 14. CI/CD 与部署

### 14.1 Docker Compose（本地开发）

```yaml
# docker/docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_commerce_ops
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports: ['5432:5432']
    volumes: ['postgres_data:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ['9000:9000', '9001:9001']
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes: ['minio_data:/data']

  api:
    build: { context: .., dockerfile: apps/api/Dockerfile.dev }
    ports: ['3001:3001']
    depends_on: [postgres, redis]
    volumes: ['..:/app', '/app/node_modules']
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/ai_commerce_ops
      REDIS_URL: redis://redis:6379

  worker:
    build: { context: .., dockerfile: apps/worker/Dockerfile.dev }
    depends_on: [postgres, redis]

  web:
    build: { context: .., dockerfile: apps/web/Dockerfile.dev }
    ports: ['3000:3000']
    depends_on: [api]

volumes:
  postgres_data:
  minio_data:
```

### 14.2 本地启动命令

```bash
# 首次初始化
pnpm install                                    # 安装所有依赖
docker compose up -d postgres redis minio       # 启动基础服务
pnpm prisma migrate dev                         # 执行数据库迁移
pnpm prisma db seed                             # 填充种子数据

# 日常开发
pnpm dev                                        # 同时启动 web + api + worker (turbo)
pnpm test                                       # 运行所有测试
pnpm build                                      # 全量构建

# 单独启动
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter worker dev
```

---

## 15. 开发里程碑任务分解

### M0：工程底座建立

**目标：** 所有开发人员可以在本地跑通完整的开发环境，基础骨架全部就绪。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| Monorepo 初始化（pnpm + turbo） | 架构 | `pnpm dev` 可启动 |
| Docker Compose 本地环境 | 架构 | postgres/redis/minio 正常运行 |
| NestJS 骨架（模块注册、全局拦截器、异常过滤器） | 后端 | `GET /health` 返回 200 |
| Prisma 初始 Schema 与首次迁移 | 后端 | 所有核心表创建成功 |
| Redis + BullMQ 初始化（队列注册） | 后端 | 队列可消费 |
| React + Vite + Router 骨架 | 前端 | 路由可跳转，AppShell 渲染 |
| 共享包初始化（types, schemas, constants） | 架构 | 前后端均可 import |
| ESLint + Prettier + Husky pre-commit | 架构 | commit 时自动格式化 |
| `.env.example` 完整配置文档 | 架构 | README 说明清楚 |

---

### M1：前端静态工程化

**目标：** 完整还原 UI 原型，接入 Mock API，所有页面可渲染。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| 侧边栏三大模块（深色 + 响应式） | 前端 | 760px 以下切换为 Drawer |
| Topbar + CommandCenter（AI 指挥台） | 前端 | 输入框可提交，显示加载状态 |
| 总览页（MetricCard + 各模块入口卡片） | 前端 | Mock 数据完整渲染 |
| 订单页（DataTable + 筛选 + 状态 Pill） | 前端 | 服务端分页 Mock 可用 |
| 商品页（库存状态 + 优化建议卡片） | 前端 | 低库存提示显示 |
| 消息页（MessageReplyEditor + AI 建议） | 前端 | 草稿输入可编辑 |
| 媒体运营中心（账号矩阵 + 指标） | 前端 | 账号状态正确显示 |
| 创作页（CreativeGenerator 表单） | 前端 | 输入选题可提交 |
| 草稿审核发布页（DraftReviewPublisher） | 前端 | 状态流转 UI 完整 |
| 系统设置三个页面（账号/托管/审批） | 前端 | 审批队列列表可渲染 |
| StatusPill + RiskActionButton + ApprovalActions | 前端 | 高风险按钮有警告 |
| Mock API 服务（msw 或 json-server） | 前端 | 所有 API 端点有 Mock |

---

### M2：中枢体系构建

**目标：** 用户可以真实登录，账号授权可以存储，审批队列可以运转，审计有记录。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| JWT 登录（注册/登录/刷新） | 后端 | Token 可用，前端可持久化 |
| RBAC 守卫（role + permission 校验） | 后端 | 无权限返回 403 |
| 平台账号 CRUD + 凭证加密存储 | 后端 | 凭证加密入库，接口不返回原文 |
| 账号状态机（连接/过期/重连） | 后端 | 状态转换测试通过 |
| 审批服务（创建/通过/驳回/变更请求） | 后端 | 互斥规则测试通过 |
| 审批守卫（高风险动作强制拦截） | 后端 | `ALWAYS_REQUIRE_APPROVAL` 生效 |
| 动作流核心（platform_actions + connector_runs 写入） | 后端 | 日志完整 |
| 审计日志服务（只写，DB 级别保护） | 后端 | INSERT 成功，UPDATE 被拒 |
| 风控规则引擎（risk_rules 表驱动） | 后端 | 不同规则返回正确 riskLevel |
| 前端接入真实认证（useAuthStore + 路由守卫） | 前端 | 未登录跳转 /login |

---

### M3：AI 生成与草稿闭环

**目标：** 完整走通「AI 生成 → 编辑草稿 → 提交审批 → 通过/驳回 → 发布模拟」流程。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| AI Creative Service（文案/脚本生成） | 后端 | LLM 返回结构化内容 |
| 草稿 CRUD + 版本控制（draft_versions） | 后端 | 每次提交审批创建版本快照 |
| 草稿状态机完整实现 | 后端 | 所有状态机测试通过 |
| media.publish 队列 Processor（发布模拟） | 后端 | 模拟成功/失败均有记录 |
| 发布失败重试机制 | 后端 | 3 次重试后标记 PUBLISH_FAILED |
| AI 指挥台 NLP 处理（解析计划，生成 AiPlan） | 后端 | 返回结构化计划步骤 |
| 前端：创作页接入真实 API | 前端 | 生成内容可编辑并保存草稿 |
| 前端：草稿审核发布页接入真实状态 | 前端 | 审批动作实时更新状态 |
| 前端：AI 指挥台展示 AiPlan 并支持确认/取消 | 前端 | 计划展示卡片 UI 完成 |
| WebSocket 任务状态推送 | 前后端 | 发布进度实时更新无需刷新 |

---

### M4：连接器只读接入

**目标：** 至少 1 个电商平台 + 1 个媒体平台可以拉取真实数据。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| 连接器抽象层 + 注册机制 | 后端 | `connectorService.execute()` 路由正确 |
| Shopify Mock Connector（只读） | 后端 | 商品/订单数据正常返回 |
| Amazon SP-API Connector（只读） | 后端 | 订单列表可以拉取（测试账号） |
| Instagram Graph API Connector（只读） | 后端 | 账号信息和 insights 返回 |
| connector_runs 完整记录 | 后端 | 每次调用有完整快照 |
| 连接健康检查定时任务（每 5 分钟） | 后端 | 账号状态自动更新 |
| Token 过期 N 天前邮件提醒 | 后端 | 测试邮件发送成功 |
| 前端：电商订单/商品接入真实数据 | 前端 | 真实数据渲染，筛选可用 |
| 前端：媒体账号矩阵接入真实状态 | 前端 | 账号授权状态实时显示 |

---

### M5：自动化编排与安全执行

**目标：** 定时任务可配置，失败有重试，整体系统可监控。

| 任务 | 负责 | 完成标准 |
|------|------|----------|
| BullMQ 定时任务（sync.orders/mediaMetrics） | 后端 | 每日自动执行 |
| BullMQ 限流器（平台 API 限流） | 后端 | 超速请求自动排队 |
| 自动化规则 CRUD + 开关 | 后端 | toggle 即时生效 |
| approval.timeout 任务（超时自动过期） | 后端 | 48h 未处理标记 EXPIRED |
| 异常检测（账号掉线、发布失败率） | 后端 | 异常触发创建待处理任务 |
| 结构化日志全面接入（Winston/Pino） | 后端 | 所有请求有完整 log 字段 |
| 前端：自动化页面接入真实任务列表 | 前端 | 开关操作即时生效 |
| MVP 验收测试（E2E 走完完整发布流程） | 全员 | Playwright 测试通过 |

---

## 附录：MVP 验收清单

在提交 M5 完成前，以下所有条目必须勾选：

- [ ] 三大模块侧边栏结构完整，760px 以下响应式正常
- [ ] 所有页面从 API 获取真实（或 Mock）数据，无硬编码
- [ ] 平台账号管理支持至少 3 个电商 + 4 个媒体平台状态展示
- [ ] 账号 Token 过期时，前端发布按钮 disabled，有明显指引
- [ ] AI 生成内容后，默认创建草稿，不直接发布
- [ ] 草稿审核发布流程（生成→编辑→提交→审批→发布）全流程可走通
- [ ] 高风险动作（media.publish, commerce.refund 等）必须进入审批，代码层不可绕过
- [ ] 审批人与发起人互斥规则有效
- [ ] 所有外部调用有 connector_runs 记录
- [ ] 发布失败有错误原因记录，可重试
- [ ] 审计日志不可物理删除（DB 级别保护）
- [ ] 凭证加密存储，接口不返回原始凭证
- [ ] 幂等键对重复发布请求有效
- [ ] 至少 1 个电商连接器 + 1 个媒体连接器完成真实只读接入
- [ ] 单元测试覆盖率 ≥ 80%（Service 层）
- [ ] E2E 测试覆盖核心发布流程

---

*本文档为开发启动的权威参考，所有偏离需记录于 `docs/adr/` 中。*