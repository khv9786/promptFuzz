# PromptFuzz 면도 4방식 — v0.1.11 / v0.1.12 보고

- **버전 흐름**: 0.1.10 → **0.1.11**(기본 4방식, npm 게시됨) → **0.1.12**(보강, 게시 예정)
- **날짜**: 2026-06-10 ~ 06-11
- **한 줄 요약**: `promptfuzz shave`에 **면도 방식 4종 선택 + 방식별 미니게임**을 추가하고, 날·손 방식의 판정/실패 처리를 보강했습니다.

> ⚠️ **게시 이력 주의**: 0.1.11을 npm에 먼저 게시(06-10 05:08 UTC)한 *뒤* 보강(날 4방향·새 방향·실패 페널티)이 들어갔습니다. npm은 게시된 버전을 덮어쓸 수 없어, **보강분은 0.1.12로 게시**합니다. (0.1.11 unpublish는 권장 안 함)

---

## 1. 면도 방식 4종

```
🪒 어떻게 면도할까요?
  1) ⚡ 레이저       — 가만히 있으면 알아서 (5초)
  2) 🔌 전기면도기   — ←/→ 키 연타
  3) 🔪 날 면도기     — 나오는 방향키 맞추기
  4) ✋ 손으로 뽑기   — 빠르게! 1초 안에 입력
  [1-4] 선택  ·  [q] 취소
```

| # | 방식 | 입력 | 난이도 |
|---|---|---|---|
| 1 | ⚡ 레이저 | 없음(자동 ~5초) | ★ |
| 2 | 🔌 전기면도기 | ←/→ 연타 (6/8/10회) | ★★ |
| 3 | 🔪 날 면도기 | 상하좌우 방향 맞추기 | ★★★ |
| 4 | ✋ 손으로 뽑기 | 상하좌우 1초 안에 | ★★★★ |

### 실패 처리 (③④ 공통) — *0.1.12 보강*
틀린 방향 / ④ 1초 초과 시: ① 따끔 메시지 랜덤 → ② **게이지 한 칸 감소**(0 바닥, 수염 살짝 되자람) → ③ 감소 동안 **게이지 빨강** → ④ **새 방향** 제시 후 재시도(처음으로 리셋 아님).

### 비대화형(hook/CI)
방식 선택 없이 자동 면도 — 동작 변화 없음.

---

## 2. 구현 / 검증
- 순수 로직 → `src/ui/shaveReducer.ts` (방식·판정·실패메시지·방향, 단위 테스트). 진행 메커닉은 기존 `reduceShave` 재사용.
- 타이머/입력 → `src/ui/ShaveGame.tsx` (Ink): 레이저 자동 틱, 손뽑기 1초 `setTimeout`, `useInput` 판정.
- typecheck ✅ · build ✅ · **vitest 240/240 ✅** (신규 `tests/shaveMethods.test.ts`) · 사용자 PowerShell 실측 완료.

---

## 3. 커밋
```
(0.1.12) chore: bump to 0.1.12 + CHANGELOG split
d6a6245  feat: miss penalty — lose a step with red gauge (blade/pluck)
f375d83  refine: blade uses 4 directions + miss shows new direction
921f2cf  chore: bump to 0.1.11 + CHANGELOG      ← npm 0.1.11 게시 지점
732a378  docs: document shave methods in README
4450dd8  feat: add 4 shave methods (laser/electric/blade/pluck)
```

---

## 4. 남은 일 / 결정사항
- **게시**: `npm login`(khv9786) 후 **`npm publish`** → 0.1.12가 latest. (0.1.11은 기본 4방식 상태로 남되, latest는 0.1.12로 갱신됨) 게시 후 `npm i -g promptfuzz`로 전역 갱신.
- **커밋 author 이메일**: 이 repo 커밋은 `khv9786 <hyunvin02@gmail.com>`. 올바른 GitHub 이메일이 `khv9786@naver.com`이면 — 앞으로 커밋: `git config --local user.email "khv9786@naver.com"`(안전). 과거 푸시 커밋까지 바꾸려면 히스토리 재작성+force 푸시 필요(위험) → 별도 결정.
- **난이도 튜닝(선택)**: ④ 손뽑기가 "1초 + 실패 시 감소"라 ⑤(10칸)에서 빡셈 — `PLUCK_WINDOW_MS` 완화 또는 시간초과는 감소 제외 가능.
