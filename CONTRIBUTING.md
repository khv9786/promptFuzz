# Contributing to PromptFuzz

기여 환영합니다! PromptFuzz는 Claude Code 토큰을 수염으로 시각화하는 작은 CLI 토이입니다.
가볍게 시작할 수 있도록 핵심만 정리했어요.

## 개발 환경

- Node.js 18 이상
- 설치 & 실행:
  ```bash
  git clone https://github.com/khv9786/promptFuzz.git
  cd promptFuzz
  npm install
  npm run dev -- status   # 빌드 없이 즉시 실행
  ```

## 핵심 설계 원칙

이 세 가지는 *타협하지 않습니다*:

1. **로컬 우선 (Local-first)** — 네트워크 호출·텔레메트리 0. `fetch`/`http`/`axios` 등 import 금지.
2. **본문 무시 (Content-blind)** — JSONL의 user/assistant 메시지 본문은 읽지 않습니다. `usage` 필드만 추출.
3. **비파괴 (Non-destructive)** — `~/.claude/settings.json` 편집 시 기존 hook 보존 + 백업. `uninstall`로 완전 복구.

자세한 배경은 [`CLAUDE.md`](CLAUDE.md), 코드 구조와 "새 기능 어디 넣지?"는 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)를 보세요.

## 의존성 정책

- `ink`/`react`는 **`src/ui/`와 `src/commands/shave.ts`에서만** dynamic import.
- `tick`/`status`/`install`/`uninstall`은 chalk만 사용 — Ink를 import하면 부팅 시간이 망가집니다.
- **부팅 시간 기준선 ~60ms** (`tick`은 PRD상 100ms 약속). 새 정적 import 추가 시 `node dist/cli.js --version`을 5회 측정해 회귀 없는지 확인하세요.
- 색상은 chalk 색 이름을 직접 쓰지 말고 [`src/ui/theme.ts`](src/ui/theme.ts)의 의미 상수를 참조하세요.

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat: 새 기능
fix: 버그 수정
refactor: 동작 변경 없는 정리
chore: 빌드/설정/의존성
docs: 문서
test: 테스트
```

- subject는 명령형, 50자 이내.
- 본문에 *왜* 바꾸는지 2~3줄.

## PR 체크리스트

PR 전에 확인:

- [ ] `npm run typecheck` 통과
- [ ] `npm run build` 통과
- [ ] `npm test` 전부 통과 (새 코드엔 테스트 추가)
- [ ] 부팅 시간 회귀 없음 (정적 import 추가 시)
- [ ] 사용자 표시 변경이면 `CHANGELOG.md` [Unreleased]에 한 줄
- [ ] 동작/명령 변경이면 `README.md` 갱신
- [ ] 제품 설계 변경이면 `docs/PRD.md` 갱신

## 테스트 작성

- `tests/<module>.test.ts`, vitest 사용.
- UI(Ink) 로직은 React 렌더 타이밍에 의존하지 말고 **순수 함수로 분리**해 테스트하세요 (예: `shaveReducer`, `stretchCardProgress`, `weeklySummary`). 이게 이 레포의 정착된 패턴입니다.
- 상태를 건드리는 명령은 `vi.mock('../src/state/storage.js')`로 `~/.promptfuzz`를 격리.

## 톤 가이드 (UI 문구 기여 시)

- 죄책감 금지. "5시간 썼다" 면박 X, "수염이 길어졌네요" O.
- 위트 + 귀여움. Claude Buddy는 화내지 않고 슬퍼하거나 살짝 삐칩니다.
- 과로 미화 금지 — 수염 길이는 자랑이 아니라 *신호*.

## 행동 강령

서로 존중해주세요. 위트는 코드와 마스코트에게, 사람에게는 친절을.

## 라이선스

기여하신 코드는 [MIT License](LICENSE) 하에 배포됩니다.
