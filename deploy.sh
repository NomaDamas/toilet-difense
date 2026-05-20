#!/usr/bin/env bash
# NomaDamas Toilet Defense — one-command GitHub Pages deploy
#
# Usage:
#   ./deploy.sh "your-username/backflow"
#   ./deploy.sh "your-username/backflow" --private
#
# Requirements:
#   - git (already installed if you have this repo)
#   - gh CLI:  brew install gh   ·   then:  gh auth login
#
# Cost: ₩0. Anthropic 토큰 사용 안 함 (네 머신에서 git push만 함).
# Bandwidth: 100GB/월 무료 한도, 이 게임으로 절대 못 채움.

set -euo pipefail

REPO_SPEC="${1:-}"
VIS="public"
if [[ "${2:-}" == "--private" ]]; then
  VIS="private"
fi

if [[ -z "$REPO_SPEC" ]]; then
  echo "❌ 레포 이름이 필요해."
  echo ""
  echo "사용법:"
  echo "  ./deploy.sh \"your-username/backflow\""
  echo ""
  echo "예시:"
  echo "  ./deploy.sh \"yeonkyu-kim/backflow\""
  echo "  ./deploy.sh \"NomaDamas/backflow\" --private"
  echo ""
  echo "GitHub username 모르겠으면:  gh api user --jq .login"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI 없음. 설치: brew install gh"
  echo "   그 다음: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh 인증 안 됨. 실행:  gh auth login"
  exit 1
fi

OWNER="${REPO_SPEC%/*}"
REPO="${REPO_SPEC#*/}"

echo "🚽 NomaDamas Toilet Defense — Deploy"
echo "   Target: $OWNER/$REPO (${VIS})"
echo ""

# 1. git init (idempotent)
if [[ ! -d .git ]]; then
  echo "→ git init"
  git init -q -b main
fi

# 2. stage
echo "→ stage files (.gitignore 적용)"
git add -A

# 3. commit (allow empty if nothing new)
if git diff --cached --quiet; then
  echo "   변경사항 없음 — 기존 커밋 사용"
else
  COMMIT_MSG="${COMMIT_MSG:-🚽 변기톤 빌드 $(date '+%Y-%m-%d %H:%M')}"
  git commit -q -m "$COMMIT_MSG"
  echo "   커밋: $COMMIT_MSG"
fi

# 4. create remote repo if not exists
if gh repo view "$REPO_SPEC" >/dev/null 2>&1; then
  echo "→ remote 레포 이미 존재 — push만"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/$REPO_SPEC.git"
  fi
  git push -u origin main
else
  echo "→ gh repo create $REPO_SPEC ($VIS)"
  gh repo create "$REPO_SPEC" \
    --"$VIS" \
    --source=. \
    --remote=origin \
    --push \
    --description="🚽 NomaDamas Toilet Defense — 변기톤 우승작. 5층 배관 사수 타워 디펜스."
fi

# 5. enable GitHub Pages on main / (root)
echo "→ GitHub Pages 활성화"
PAGES_RESULT=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPO_SPEC/pages" \
  -f "source[branch]=main" \
  -f "source[path]=/" 2>&1 || true)

if echo "$PAGES_RESULT" | grep -q "already exists"; then
  echo "   Pages 이미 활성화됨"
elif echo "$PAGES_RESULT" | grep -q "errors"; then
  echo "   ⚠ Pages API 응답:"
  echo "$PAGES_RESULT" | sed 's/^/      /'
  echo "   Settings → Pages에서 수동 활성화도 가능"
fi

# 6. summary
PAGES_URL="https://${OWNER}.github.io/${REPO}/"
REPO_URL="https://github.com/${REPO_SPEC}"

echo ""
echo "✅ 배포 완료!"
echo ""
echo "  📦 레포:  $REPO_URL"
echo "  🌐 게임:  $PAGES_URL"
echo ""
echo "  ⏱  Pages 첫 빌드는 1~3분 걸려. 잠시 후 위 URL 열어봐."
echo "  🔄 업데이트:  ./deploy.sh \"$REPO_SPEC\" (다시 실행하면 됨)"
echo ""
echo "키친타월 절대 금물. 🚽"
