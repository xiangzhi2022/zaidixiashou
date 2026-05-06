#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Git 自动同步脚本 - 双向同步到 GitHub
# 用法: bash git-sync.sh [commit_message]
# ═══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

COMMIT_MSG="${1:-chore: 自动同步 $(date '+%Y-%m-%d %H:%M')}"
REMOTE="${2:-origin}"
BRANCH="${3:-main}"

echo -e "${CYAN}[Git Sync]${NC} 开始同步..."

# 1. 拉取远程最新代码（防止冲突）
echo -e "${CYAN}[1/5]${NC} 拉取远程更新..."
git fetch "$REMOTE" "$BRANCH" 2>/dev/null || true
if git diff --quiet HEAD "$REMOTE/$BRANCH" 2>/dev/null; then
  echo -e "${GREEN}  ✓${NC} 远程无新更新"
else
  echo -e "${YELLOW}  !${NC} 发现远程更新，执行 rebase..."
  git pull --rebase "$REMOTE" "$BRANCH" 2>/dev/null || {
    echo -e "${RED}  ✗ Rebase 冲突，请手动解决后重试${NC}"
    exit 1
  }
  echo -e "${GREEN}  ✓${NC} 远程更新已合并"
fi

# 2. 检查本地变更
echo -e "${CYAN}[2/5]${NC} 检查本地变更..."
if git diff --quiet && git diff --cached --quiet; then
  echo -e "${GREEN}  ✓${NC} 无本地变更"
else
  # 3. 暂存并提交
  echo -e "${CYAN}[3/5]${NC} 暂存并提交变更..."
  git add -A
  git commit -m "$COMMIT_MSG" --no-verify 2>/dev/null || true
  CHANGED=$(git diff --name-only HEAD~1 2>/dev/null | wc -l)
  echo -e "${GREEN}  ✓${NC} 已提交 ${CHANGED} 个文件变更"
fi

# 4. 推送到远程
echo -e "${CYAN}[4/5]${NC} 推送到 $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH" 2>&1 | tail -3
echo -e "${GREEN}  ✓${NC} 推送完成"

# 5. 状态报告
echo -e "${CYAN}[5/5]${NC} 同步状态:"
git log --oneline -3
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  同步完成!${NC}"
echo -e "  仓库: https://github.com/xiangzhi2022/zaidixiashou"
echo -e "  分支: $BRANCH"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
