# PromptFuzz Architecture

> PRD는 *제품* 문서, 이건 *코드 구조* 문서. "새 기능을 어디 넣지?"의 답을 PRD 21장 안 읽고도 찾으라고 만들었다. 제품/메타포 정의와 모순이 보이면 [PRD](PRD.md)가 진실의 원천이다.

## 폴더별 책임

| 폴더 | 책임 | 외부 의존 |
|---|---|---|
| `src/types/` | 모든 타입 정의 (`BeardStage`, `PromptFuzzState`, `UsageDelta`, `StageInfo`, ...) | 없음 |
| `src/data/` | 정적 컨텐츠 (스트레칭 카드 5장). 런타임 불변. | `types/` |
| `src/parser/` | JSONL 스트리밍 파싱. **`usage` 필드만 읽고 본문은 폐기.** | `types/`, node fs/readline |
| `src/state/` | 비즈니스 로직 — 토큰→단계 계산, 면도, persistence, 마이그레이션. | `types/`, `parser/`, node fs |
| `src/hooks/` | `~/.claude/settings.json` 비파괴 편집 (백업, 추가, 제거). | `types/`, node fs |
| `src/commands/` | CLI 명령 진입점 (install / uninstall / status / shave / tick). | `state/`, `hooks/`, `ui/`, chalk |
| `src/ui/` | 터미널 렌더링 (현재는 status가 자체 chalk 출력, Ink는 v2 백로그). | chalk |
| `src/cli.ts` | Commander 진입점, 명령 등록. | `commands/`, commander |

## 의존성 규칙

```
types  ←  data, parser, state, hooks, commands, ui
parser ←  state
state  ←  commands
hooks  ←  commands
ui, data ←  commands
```

- **단방향만.** parser는 state를 모르고, state는 commands를 모른다.
- **parser는 node 표준 + types만 import.** 새 의존성 추가 시 본문 노출 위험 재검토.
- **types는 잎(leaf).** types에서 다른 src/* import 금지.

## 데이터 흐름

```
Claude Code 세션
        │
        ▼  (세션마다 append)
~/.claude/projects/<project>/<session-uuid>.jsonl
        │
        ▼  (Stop hook이 발동)
"promptfuzz tick"
        │
        ▼
commands/tick.ts  →  state/index.ts::tick()
                         │
                         ├──→  parser/index.ts::scanAllSessions(lastOffsets)
                         │         └──→  parser/jsonl-stream.ts::parseJsonlFile(file, fromOffset)
                         │                     ↑ usage만 추출, 본문 즉시 폐기
                         │
                         ├──→  state/stages.ts::stageFromTokens(cumulative)
                         │
                         └──→  state/storage.ts::saveState()  →  ~/.promptfuzz/state.json (0600)

"promptfuzz status"  →  state/index.ts::tick() → getCurrentState() → chalk 렌더링
"promptfuzz shave"   →  state/index.ts::performShave() → 스트레칭 카드 1장
"promptfuzz install" →  hooks/manager.ts::installHook() → state/onboarding.ts::runOnboardingShave()
```

## 주요 시그니처

```ts
// parser
parseJsonlFile(filePath, fromOffset): { delta: UsageDelta, newOffset: number }
scanAllSessions(previousOffsets): { totalDelta, updatedOffsets }

// state
tick(): { state, stage, stageChanged, previousStage, newTokens }
performShave(): PromptFuzzState
stageFromTokens(tokens): StageInfo
runOnboardingShave(opts?): { choice: 'shave' | 'keep' | 'skip-silent' }

// hooks
installHook(): { alreadyInstalled: boolean }
uninstallHook(): void
isInstalled(): boolean
```

## 새 기능 어디 넣지?

```
새 기능이 무엇을 다루나?
├─ JSONL에서 새 필드 추출? ─────────────→ parser/jsonl-stream.ts::extractUsage 확장
├─ 토큰→무언가 매핑 규칙 변경? ──────────→ state/stages.ts
├─ state.json에 새 필드? ────────────────→ types/index.ts + state/storage.ts (migrate 갱신 필수)
├─ 새 CLI 명령? ──────────────────────────→ commands/<new>.ts + cli.ts 등록
├─ 화면에 새 출력? ──────────────────────→ commands/status.ts 또는 ui/
├─ Claude Code 설정 건드림? ─────────────→ hooks/manager.ts
└─ 정적 텍스트/카드 추가? ───────────────→ data/
```

## 테스트 위치

- `tests/<module>.test.ts` — 각 모듈마다 1파일.
- 현재: `tests/parser.test.ts`, `tests/stages.test.ts`, `tests/onboarding.test.ts`.
- vitest 사용. 임시 파일은 `mkdtemp(tmpdir(), 'promptfuzz-test-')` 패턴.
- **integration test 없음** — Hook 발동은 수동 dogfooding으로 확인.

## 마이그레이션 약속

`PromptFuzzState`에 필드 추가 시:
1. `types/index.ts`에 옵셔널 아닌 필드로 추가
2. `state/storage.ts::createInitialState()`에 기본값 추가
3. `state/storage.ts::migrate()`에서 누락 시 기본값 보강 (사용자가 이전 버전 state.json을 갖고 있을 수 있음)
4. CURRENT_VERSION 올리지 않는다 — 보강식 마이그레이션은 같은 버전 내에서 가능
