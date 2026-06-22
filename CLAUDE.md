# PromptFuzz

Claude Code 토큰 사용량을 *가상 수염*으로 시각화하고, 면도(휴식+스트레칭)로 리셋하는 CLI 토이.

## 핵심 메타포

- **수염** = 토큰 누적량 (`~/.claude/projects/**/*.jsonl`의 `usage` 합산)
- **단계** = 매끈 / 까끌까끌 / 북슬북슬 / 따갑따갑 / 고슴도치 (5단계)
- **면도** = `promptfuzz shave` — 카운터 0 리셋 + 스트레칭 카드 1장
- **캐릭터** = 개발자(아빠) ↔ Claude Buddy(아이). 수염이 길어질수록 Buddy가 따가워한다.

## 컨셉 불변 규칙 (최우선)

- **수염은 개발자(아빠)에게만 자란다.** Claude Buddy(아이)는 수염이 없고 *반응만* 한다. 역할을 섞으면 컨셉이 무너진다.
- **영문 단계 ID(`smooth`/`stubble`/`bushy`/`rugged`/`hermit`)는 변경 금지** — 한국어 단계명과 무관한 코드 키다.
- duo 렌더의 거리두기·고개 방향은 귀엽고 죄책감 없게. 하트(💕)는 *당신(개발자)* 쪽으로 읽히게 유지.

## 톤 가이드

- **죄책감 금지.** "5시간 썼다" 면박 X. "수염이 길어졌네요" O.
- **위트 + 귀여움.** Claude Buddy는 화내지 않고 슬퍼하거나 살짝 삐친다.
- **과로 미화 금지.** 수염 길이는 자랑이 아니라 *신호*.
- 멘트는 한국어 자연체, **존댓말**로 다정하게. 다그치지 않는다 — '잔소리 안 하는 다정함'이 핵심 가치.
- 동결된 `messages[0]`은 파괴적 변경 금지 (랜덤 변형은 *추가*만).
- 실패·경고 메시지도 코믹하게 — 피·심각·아픔을 과장하지 않는다.

## 4대 설계 원칙

1. **로컬 우선** — 외부 네트워크 호출 0, 텔레메트리 0. 로컬 저장 0600, dailyLog는 토큰·단계만 90일 (상세 → PRD §15).
2. **본문 무시** — JSONL의 user/assistant 메시지 *본문*은 메모리에 올리지 않는다. `usage` 필드만 추출.
3. **비파괴** — Hook 등록 시 `~/.claude/settings.json` 기존 내용 보존, 백업 생성, 원자적 쓰기(temp→rename), uninstall로 완전 복구.
4. **단일 책임** — Parser는 토큰만, State는 단계 계산만, Renderer는 출력만.

## 의존성 정책 (Ink / React)

- `ink`와 `react`는 **`src/ui/`와 `src/commands/shave.ts`에서만** import.
- `tick`, `status`, `install`, `uninstall`은 chalk + console.log만 사용 (정적/동적 import 모두 금지).
- 새 사용처를 추가할 때는 항상 dynamic import: `const { render } = await import('ink')`.
- `tsup.config.ts`는 `external: ['ink', 'react']`로 두 모듈을 정적 번들에서 제외.
- **측정 근거**: 정적 import는 부팅 시간 60ms → 323ms (+262ms, 5.4배)를 부른다. tick은 PRD 13.3에서 "<100ms"를 약속했으므로 정적 import는 곧 PRD 위반.
- Dependabot 메이저 업데이트는 로컬 테스트 후 머지. 보안 패치는 우선.

## 정렬 / 렌더링

- duo 렌더에서 **Claude 앞은 순수 ASCII만** (이모지 폭 의존 제거). 상호작용 글리프(하트 등)는 *줄 끝(Claude 뒤)*에 → 터미널 무관 정렬.
- **80컬럼 폭 초과 금지.** 폭 계산은 `visualWidth` 사용 (ASCII 1 / 이모지·한글 2).

## 품질 게이트 (커밋 전 필수)

- `typecheck` + `build` + `test` 모두 통과 후 커밋 (`/test-full`).
- 정렬·UI 변경은 **PowerShell + cmd 둘 다** 실측 (cmd만 보면 PowerShell 정렬을 놓친다).
- 미커밋 변경(너지)을 working tree에 남기지 않는다.

## 버전 / 릴리스

- 버전은 `package.json` **단일 소스** (v0.1.13~).
- `npm publish`·`git push`는 **사용자(오케스트레이터)만** — Claude Code는 커밋까지만 (헤드리스 인증 불가). `--force` 금지.
- npm 게시 버전은 덮어쓰기 불가 → 보강은 다음 patch로.

## 작업 방식

- 막히거나 의심스러우면 멈추고 정직하게 보고 (추측 강행 금지).
- 컨셉·원칙과 충돌하는 요청은 플래그.
- 보고에 '너의 의견'(개선 제안·우려)을 포함한다.

## 절대 하지 말 것

- 네트워크 요청 (fetch, http, https, axios 등 import 금지)
- 텔레메트리·익명 통계 송신
- JSONL 본문 저장 또는 메모리 누적
- `~/.claude/settings.json` 다른 도구의 hook 또는 기존 `statusLine` 확인 없이 덮어쓰기
- 사용자의 `state.json`을 마이그레이션 없이 비호환 변경
- `tick`/`status`/`install`/`uninstall`에 ink 또는 react import (정적이든 동적이든)

## 자주 쓰는 명령

```
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/cli.js
npm test            # vitest run
npm run dev -- status   # 빌드 없이 즉시 실행
/test-full          # typecheck + build + test 한 번에 (Claude Code 슬래시 커맨드)
```

## 상세 정보

- 제품 설계 / 5단계 정의 / 시나리오 → [`docs/PRD.md`](docs/PRD.md)
- 폴더별 책임 / 데이터 흐름 / 의존성 규칙 → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 면책

PromptFuzz는 Anthropic과 무관한 비공식 도구다. Claude Buddy는 위트용 마스코트일 뿐, 실제 Claude의 의견·상태·감정과 무관하다.
