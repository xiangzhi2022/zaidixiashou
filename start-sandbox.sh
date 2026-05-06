#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AI Commerce Ops - 沙箱一键启动脚本
# 功能：环境检查 → 自动修复 → 启动服务 → 健康验证
# ═══════════════════════════════════════════════════════════

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 日志目录
LOG_DIR="/app/work/logs/bypass"
mkdir -p "$LOG_DIR"

# ═══════════════════════════════════════════════════════════
# 工具函数
# ═══════════════════════════════════════════════════════════
log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step()  { echo -e "${CYAN}[→]${NC} $1"; }
log_header(){ echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}\n${BLUE}  $1${NC}\n${BLUE}═══════════════════════════════════════════════════════${NC}"; }

check_port() {
  ss -lptn "sport = :$1" 2>/dev/null | grep -q LISTEN
}

kill_port() {
  local pid
  pid=$(ss -lptn "sport = :$1" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1)
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    log_info "已终止端口 $1 上的进程 (PID: $pid)"
  fi
}

wait_for_port() {
  local port=$1 max_wait=${2:-15} i=0
  while ! check_port "$port" && [ $i -lt $max_wait ]; do
    sleep 1
    i=$((i + 1))
  done
  check_port "$port"
}

# ═══════════════════════════════════════════════════════════
# Phase 1: 环境检查
# ═══════════════════════════════════════════════════════════
log_header "Phase 1: 环境检查"

# 1.1 Node.js
log_step "检查 Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  log_info "Node.js ${NODE_VER}"
else
  log_error "Node.js 未安装"
  exit 1
fi

# 1.2 pnpm
log_step "检查 pnpm..."
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm -v)
  log_info "pnpm v${PNPM_VER}"
else
  log_error "pnpm 未安装，尝试安装..."
  npm install -g pnpm 2>/dev/null && log_info "pnpm 安装成功" || { log_error "pnnpm 安装失败"; exit 1; }
fi

# 1.3 项目依赖
log_step "检查项目依赖..."
if [ ! -d "node_modules" ]; then
  log_warn "node_modules 不存在，执行 pnpm install..."
  pnpm install 2>&1 | tail -3
  log_info "依赖安装完成"
else
  log_info "项目依赖已存在"
fi

# 1.4 检查共享包构建
log_step "检查共享包构建状态..."
for pkg in shared connectors; do
  PKG_DIR="packages/$pkg"
  if [ -d "$PKG_DIR/src" ] && [ ! -d "$PKG_DIR/dist" ]; then
    log_warn "$pkg 未构建，执行构建..."
    pnpm --filter "@ai-commerce-ops/$pkg" build 2>&1 | tail -3
    log_info "$pkg 构建完成"
  else
    log_info "$pkg 已就绪"
  fi
done

# 1.5 检查基础设施 (PostgreSQL / Redis)
log_step "检查基础设施..."
HAS_PG=false
HAS_REDIS=false

# --- PostgreSQL ---
if command -v pg_isready &>/dev/null && pg_isready -q 2>/dev/null; then
  HAS_PG=true
  log_info "PostgreSQL: 已运行"
elif command -v pg_ctlcluster &>/dev/null; then
  log_step "正在启动 PostgreSQL..."
  pg_ctlcluster 16 main start &>/dev/null 2>&1
  sleep 2
  if pg_isready -q 2>/dev/null; then
    HAS_PG=true
    log_info "PostgreSQL: 启动成功"
    # 确保 dev 用户和 ai_commerce_ops 数据库存在
    su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='dev'\"" -tA 2>/dev/null | grep -q 1 || \
      su - postgres -c "psql -c \"CREATE USER dev WITH PASSWORD 'dev' SUPERUSER;\"" &>/dev/null
    su - postgres -c "psql -lqt" 2>/dev/null | cut -d '|' -f1 | grep -qw ai_commerce_ops || \
      su - postgres -c "psql -c \"CREATE DATABASE ai_commerce_ops OWNER dev;\"" &>/dev/null
  else
    log_warn "PostgreSQL: 启动失败（将使用 Mock API）"
  fi
else
  # PostgreSQL 未安装 → 自动安装
  log_step "PostgreSQL 未安装，正在自动安装..."
  DEBIAN_FRONTEND=noninteractive apt-get update -qq &>/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-client &>/dev/null
  if command -v pg_ctlcluster &>/dev/null; then
    log_step "正在启动 PostgreSQL..."
    pg_ctlcluster 16 main start &>/dev/null 2>&1 || pg_ctlcluster 14 main start &>/dev/null 2>&1 || true
    sleep 3
    if pg_isready -q 2>/dev/null; then
      HAS_PG=true
      log_info "PostgreSQL: 安装并启动成功"
      su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='dev'\"" -tA 2>/dev/null | grep -q 1 || \
        su - postgres -c "psql -c \"CREATE USER dev WITH PASSWORD 'dev' SUPERUSER;\"" &>/dev/null
      su - postgres -c "psql -lqt" 2>/dev/null | cut -d '|' -f1 | grep -qw ai_commerce_ops || \
        su - postgres -c "psql -c \"CREATE DATABASE ai_commerce_ops OWNER dev;\"" &>/dev/null
    else
      log_warn "PostgreSQL: 安装后启动失败（将使用 Mock API）"
    fi
  else
    log_warn "PostgreSQL: 自动安装失败（将使用 Mock API）"
  fi
fi

# --- Redis ---
if command -v redis-cli &>/dev/null && redis-cli ping &>/dev/null 2>&1; then
  HAS_REDIS=true
  log_info "Redis: 已运行"
elif command -v redis-server &>/dev/null; then
  log_step "正在启动 Redis..."
  redis-server --daemonize yes --port 6379 &>/dev/null 2>&1
  sleep 1
  if redis-cli ping &>/dev/null 2>&1; then
    HAS_REDIS=true
    log_info "Redis: 启动成功"
  else
    log_warn "Redis: 启动失败（将使用 Mock API）"
  fi
else
  # Redis 未安装 → 自动安装
  log_step "Redis 未安装，正在自动安装..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq redis-server &>/dev/null
  if command -v redis-server &>/dev/null; then
    log_step "正在启动 Redis..."
    redis-server --daemonize yes --port 6379 &>/dev/null 2>&1
    sleep 1
    if redis-cli ping &>/dev/null 2>&1; then
      HAS_REDIS=true
      log_info "Redis: 安装并启动成功"
    else
      log_warn "Redis: 安装后启动失败（将使用 Mock API）"
    fi
  else
    log_warn "Redis: 自动安装失败（将使用 Mock API）"
  fi
fi

# 1.6 清理残留端口
log_step "检查残留进程..."
for port in 5000 3001; do
  if check_port "$port"; then
    log_warn "端口 $port 已被占用，清理..."
    kill_port "$port"
  fi
done
log_info "端口清理完成"

# ═══════════════════════════════════════════════════════════
# Phase 2: 构建与修复
# ═══════════════════════════════════════════════════════════
log_header "Phase 2: 构建与修复"

# 2.1 构建前端
log_step "构建前端..."
if pnpm --filter web build 2>&1 | tail -3; then
  log_info "前端构建成功"
else
  log_warn "前端构建失败，将使用开发模式"
fi

# 2.2 决定 API 模式
if [ "$HAS_PG" = true ] && [ "$HAS_REDIS" = true ]; then
  API_MODE="full"

  # 2.2.1 数据库迁移与初始化
  log_step "同步数据库 Schema..."
  DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@localhost:5432/ai_commerce_ops}" \
    npx prisma db push --schema prisma/schema.prisma --accept-data-loss 2>&1 | tail -5
  log_info "数据库同步完成"

  log_step "生成 Prisma Client..."
  DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@localhost:5432/ai_commerce_ops}" \
    npx prisma generate --schema prisma/schema.prisma 2>&1 | tail -3

  log_step "构建完整 API..."
  pnpm --filter api build 2>&1 | tail -5
  log_info "API 构建完成"

  log_step "检查种子数据..."
  USER_COUNT=$(DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@localhost:5432/ai_commerce_ops}" \
    su - postgres -c "psql -d ai_commerce_ops -t -c 'SELECT count(*) FROM users;'" 2>/dev/null | tr -d ' ')
  if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    log_info "初始化种子数据..."
    DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@localhost:5432/ai_commerce_ops}" \
      npx tsx prisma/seed.ts 2>&1 | tail -3
  else
    log_info "数据库已有 $USER_COUNT 个用户，跳过种子"
  fi
else
  API_MODE="mock"
  log_info "使用 Mock API 模式（无需 PostgreSQL/Redis）"
fi

# ═══════════════════════════════════════════════════════════
# Phase 3: 启动服务
# ═══════════════════════════════════════════════════════════
log_header "Phase 3: 启动服务"

# 3.1 启动 API 服务
log_step "启动 API 服务 (端口 3001)..."
if [ "$API_MODE" = "full" ]; then
  # 完整模式：NestJS API
  DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@localhost:5432/ai_commerce_ops}" \
  REDIS_URL="${REDIS_URL:-redis://localhost:6379}" \
  JWT_SECRET="${JWT_SECRET:-dev-jwt-secret-change-in-production-min-32-chars}" \
  CREDENTIAL_ENCRYPTION_KEY="${CREDENTIAL_ENCRYPTION_KEY:-$(printf 'a%.0s' {1..64})}" \
  S3_BUCKET="${S3_BUCKET:-mock-bucket}" \
  S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:9000}" \
  node apps/api/dist/main.js > "$LOG_DIR/api.log" 2>&1 &
  API_PID=$!
else
  # Mock 模式：轻量 Node.js Mock API
  PORT=3001 node apps/api/mock-server.js > "$LOG_DIR/api.log" 2>&1 &
  API_PID=$!
fi
log_info "API 进程 PID: $API_PID"

# 等待 API 启动
if wait_for_port 3001 15; then
  log_info "API 服务已启动 (http://localhost:3001)"
else
  log_error "API 服务启动失败，查看日志: $LOG_DIR/api.log"
  tail -n 20 "$LOG_DIR/api.log"
  exit 1
fi

# 3.2 启动前端服务
log_step "启动前端服务 (端口 5000)..."
pnpm --filter web dev > "$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!
log_info "前端进程 PID: $WEB_PID"

# 等待前端启动
if wait_for_port 5000 20; then
  log_info "前端服务已启动 (http://localhost:5000)"
else
  log_error "前端服务启动失败，查看日志: $LOG_DIR/web.log"
  tail -n 20 "$LOG_DIR/web.log"
  exit 1
fi

# ═══════════════════════════════════════════════════════════
# Phase 4: 健康验证
# ═══════════════════════════════════════════════════════════
log_header "Phase 4: 健康验证"

# 4.1 API 健康检查
log_step "API 健康检查..."
API_HEALTH=$(curl -s --max-time 5 http://localhost:3001/health 2>/dev/null || echo "FAIL")
if echo "$API_HEALTH" | grep -q "ok"; then
  log_info "API 健康: $API_HEALTH"
else
  log_error "API 健康检查失败: $API_HEALTH"
fi

# 4.2 前端健康检查
log_step "前端健康检查..."
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5000 2>/dev/null || echo "000")
if [ "$FE_STATUS" = "200" ]; then
  log_info "前端健康: HTTP $FE_STATUS"
else
  log_error "前端健康检查失败: HTTP $FE_STATUS"
fi

# 4.3 API 代理检查
log_step "API 代理检查..."
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5000/api/auth/profile 2>/dev/null || echo "000")
if [ "$PROXY_STATUS" != "000" ]; then
  log_info "API 代理: HTTP $PROXY_STATUS (正常转发)"
else
  log_warn "API 代理未响应，请检查 Vite 代理配置"
fi

# ═══════════════════════════════════════════════════════════
# Phase 5: 启动完成
# ═══════════════════════════════════════════════════════════
EXTERNAL_URL="${COZE_PROJECT_DOMAIN_DEFAULT:-http://localhost:5000}"

echo ""
log_header "启动完成!"
echo -e "${GREEN}  前端页面:${NC}  http://localhost:5000"
echo -e "${GREEN}  外部访问:${NC}  $EXTERNAL_URL"
echo -e "${GREEN}  API 服务:${NC}  http://localhost:3001"
echo -e "${GREEN}  API 模式:${NC}  $API_MODE"
echo -e "${GREEN}  健康检查:${NC}  http://localhost:3001/health"
echo ""
echo -e "${CYAN}  测试账户:${NC}"
echo -e "    手机号: 13800138000  验证码: 888888"
echo -e "    邮箱: admin@example.local  密码: admin123"
echo ""
echo -e "${CYAN}  日志查看:${NC}"
echo -e "    前端: tail -f $LOG_DIR/web.log"
echo -e "    API:  tail -f $LOG_DIR/api.log"
echo ""
