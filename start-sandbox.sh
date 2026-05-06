#!/bin/bash
set -e

echo "=== AI Commerce Dashboard 启动脚本 (沙箱环境) ==="
echo ""

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 启动前端 (Next.js)
echo "[1/2] 启动前端服务 (端口 5000)..."
cd apps/web
pnpm run dev > /app/work/logs/bypass/dev.log 2>&1 &
cd ../..

# 等待前端启动
sleep 5

# 启动后端 API (NestJS) - 无数据库模式
echo "[2/2] 启动后端 API (端口 3001)..."
cd apps/api
PORT=3001 node dist/main.js > /app/work/logs/bypass/api.log 2>&1 &
cd ../..

# 等待后端启动
sleep 5

# 检查服务状态
echo ""
echo "=== 服务状态 ==="
ss -tuln 2>/dev/null | grep -E ':(5000|3001)' || echo "检查端口..."

# 获取沙箱外部访问地址
EXTERNAL_URL="${COZE_PROJECT_DOMAIN_DEFAULT:-http://localhost:5000}"

echo ""
echo "=============================================="
echo "           启动完成!"
echo "=============================================="
echo ""
echo "本地访问:"
echo "  前端页面: http://localhost:5000"
echo "  API 服务: http://localhost:3001"
echo ""
echo "外部访问:"
echo "  $EXTERNAL_URL"
echo ""
echo "=============================================="
echo "           测试账户"
echo "=============================================="
echo ""
echo "  短信登录:"
echo "    手机号: 13800138000"
echo "    验证码: 888888"
echo ""
echo "  邮箱登录:"
echo "    邮箱: admin@example.local"
echo "    密码: admin123"
echo ""
echo "  微信扫码: 任意 code 值即可登录"
echo "  支付宝扫码: 任意 code 值即可登录"
echo ""
echo "=============================================="
echo "           日志查看"
echo "=============================================="
echo "  前端日志: tail -f /app/work/logs/bypass/dev.log"
echo "  后端日志: tail -f /app/work/logs/bypass/api.log"
echo ""
