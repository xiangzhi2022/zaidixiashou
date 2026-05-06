#!/bin/bash
set -e

echo "=== AI Commerce Ops - Full Stack Startup ==="

# 1. Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo "[1/6] Starting PostgreSQL..."
  pg_ctlcluster 16 main start 2>/dev/null || true
  sleep 2
else
  echo "[1/6] PostgreSQL already running"
fi

# 2. Start Redis if not running
if ! redis-cli ping &>/dev/null; then
  echo "[2/6] Starting Redis..."
  redis-server --daemonize yes --port 6379
  sleep 1
else
  echo "[2/6] Redis already running"
fi

# 3. Build workspace packages
echo "[3/6] Building workspace packages..."
cd /workspace/projects
pnpm --filter @ai-commerce-ops/shared build 2>/dev/null
pnpm --filter @ai-commerce-ops/connectors build 2>/dev/null
pnpm --filter api build 2>/dev/null

# 4. Run database migrations
echo "[4/6] Running database migrations..."
export DATABASE_URL=postgresql://dev:dev@localhost:5432/ai_commerce_ops
npx prisma migrate deploy 2>/dev/null || true

# 5. Start API server (port 3001)
echo "[5/6] Starting API server on port 3001..."
cd /workspace/projects/apps/api
node dist/main.js &>/app/work/logs/bypass/api.log &
API_PID=$!
sleep 3

# 6. Start Web frontend (port 5000)
echo "[6/6] Starting Web frontend on port 5000..."
cd /workspace/projects
pnpm --filter web dev &>/app/work/logs/bypass/web.log &

echo ""
echo "=== All Services Started ==="
echo "  Web Frontend:  http://localhost:5000"
echo "  API Server:    http://localhost:3001"
echo "  API Docs:      http://localhost:3001/api/docs"
echo "  Health Check:  http://localhost:3001/health"
echo "  PostgreSQL:    localhost:5432"
echo "  Redis:         localhost:6379"
echo "============================"

# Keep script running
wait
