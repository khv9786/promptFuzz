#!/usr/bin/env bash
# ============================================================================
# PromptFuzz — 첫 푸시 가이드 (8개 단위 커밋 전략)
# ============================================================================
#
# 사용법:
#   1) 압축 푼 디렉토리로 이동: cd promptfuzz
#   2) 이 스크립트를 검토: cat scripts/first-push.sh
#   3) 필요하면 한 줄씩 직접 실행하거나, 전체 실행:
#        bash scripts/first-push.sh
#
# 이 스크립트는 빈 레포(https://github.com/khv9786/promptFuzz)에
# 8개의 의미 단위 커밋으로 스켈레톤을 푸시한다.
# ============================================================================

set -e

REPO_URL="https://github.com/khv9786/promptFuzz.git"

echo "🌿 PromptFuzz 첫 푸시 시작..."
echo

# ----------------------------------------------------------------------------
# 0. Git 초기화 + 원격 연결
# ----------------------------------------------------------------------------

if [ ! -d ".git" ]; then
  git init -b main
  echo "✓ git 초기화 (main 브랜치)"
fi

if ! git remote | grep -q origin; then
  git remote add origin "$REPO_URL"
  echo "✓ origin 연결: $REPO_URL"
fi

# 사용자 정보 확인 (없으면 안내)
if ! git config user.name >/dev/null 2>&1; then
  echo "⚠ git user.name이 설정되지 않았어요. 먼저 실행해주세요:"
  echo "    git config user.name \"Your Name\""
  echo "    git config user.email \"you@example.com\""
  exit 1
fi

echo

# ----------------------------------------------------------------------------
# 1. 빌드 인프라
# ----------------------------------------------------------------------------
echo "📦 [1/8] chore: initialize project with TypeScript and tsup"
git add package.json tsconfig.json tsup.config.ts .gitignore
git commit -m "chore: initialize project with TypeScript and tsup

- Node.js 18+ requirement
- ESM module type
- tsup build with shebang banner for CLI
- vitest for testing"

# ----------------------------------------------------------------------------
# 2. 타입 + 정적 데이터
# ----------------------------------------------------------------------------
echo "📦 [2/8] feat: define types, stage definitions and stretch cards"
git add src/types src/data src/state/stages.ts
git commit -m "feat: define types, stage definitions and stretch cards

- 5 beard stages with thresholds (10K/50K/200K/500K)
- Each stage has Korean name, color, beard art, buddy face, message
- 5 stretch cards (turtle-neck, lower-back, wrist, shoulder, eye)
- Pure functions for stage lookup"

# ----------------------------------------------------------------------------
# 3. JSONL 파서 (보안 원칙 강조)
# ----------------------------------------------------------------------------
echo "📦 [3/8] feat: add JSONL parser with content-blind token extraction"
git add src/parser
git commit -m "feat: add JSONL parser with content-blind token extraction

- Streaming line-by-line parsing (no full memory load)
- Extracts only \`usage\` field from message entries
- Counts input + cache_creation + cache_read + output tokens
- Incremental parsing with byte offset tracking
- Prompt/response bodies are never read or stored"

# ----------------------------------------------------------------------------
# 4. State Engine + Storage
# ----------------------------------------------------------------------------
echo "📦 [4/8] feat: add state engine and persistent storage"
git add src/state
git commit -m "feat: add state engine and persistent storage

- tick(): scan all JSONL, accumulate tokens, detect stage change
- performShave(): reset counter, append shave history (capped at 30)
- recordStretchCard(): track shown cards (capped at 10)
- Persistence at ~/.promptfuzz/state.json with 0600 permissions
- Schema migration support"

# ----------------------------------------------------------------------------
# 5. Hook Manager
# ----------------------------------------------------------------------------
echo "📦 [5/8] feat: add hook manager for Claude Code settings"
git add src/hooks
git commit -m "feat: add hook manager for Claude Code settings

- Safely edits ~/.claude/settings.json
- Preserves existing hooks (additive merge)
- Creates backup before modification
- uninstall removes only our hook, leaves others intact"

# ----------------------------------------------------------------------------
# 6. Commands + CLI 진입점
# ----------------------------------------------------------------------------
echo "📦 [6/8] feat: add CLI commands and entry point"
git add src/commands src/cli.ts src/ui
git commit -m "feat: add CLI commands and entry point

- install/uninstall: hook management
- status: dual-character display with chalk colors
- shave: reset counter + show stretch card
- tick: silent hook-triggered update, < 100ms target
- ui/ placeholder for future Ink components"

# ----------------------------------------------------------------------------
# 7. 테스트
# ----------------------------------------------------------------------------
echo "📦 [7/8] test: add unit tests for stages and parser"
git add tests
git commit -m "test: add unit tests for stages and parser

- 10 stage tests: thresholds, edge cases, Korean names
- 6 parser tests: empty, usage extraction, cache tokens,
  malformed lines, incremental parsing
- All 16 tests passing"

# ----------------------------------------------------------------------------
# 8. 문서 + CI
# ----------------------------------------------------------------------------
echo "📦 [8/8] docs: add README, PRD and CI workflow"
git add README.md docs/PRD.md .github/ scripts/first-push.sh
git commit -m "docs: add README, PRD and CI workflow

- README with installation, usage, privacy disclaimer
- Full PRD (21 sections) in Markdown for git-friendly diffs
- GitHub Actions CI: typecheck + build + test on Node 18 & 20
- First-push helper script for reproducibility"

# ----------------------------------------------------------------------------
# 푸시
# ----------------------------------------------------------------------------
echo
echo "🚀 origin/main으로 푸시합니다..."
git push -u origin main

echo
echo "✅ 완료! https://github.com/khv9786/promptFuzz 에서 확인하세요."
echo "    8개의 의미 단위 커밋으로 아키텍처 계층이 그대로 보입니다."
