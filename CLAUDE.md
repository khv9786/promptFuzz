# PromptFuzz

Claude Code 토큰 사용량을 *가상 수염*으로 시각화하고, 면도(휴식+스트레칭)로 리셋하는 CLI 토이.

## 핵심 메타포

- **수염** = 토큰 누적량 (`~/.claude/projects/**/*.jsonl`의 `usage` 합산)
- **단계** = 매끈 / 까끌까끌 / 북슬북슬 / 따갑따갑 / 고슴도치 (5단계)
- **면도** = `promptfuzz shave` — 카운터 0 리셋 + 스트레칭 카드 1장
- **캐릭터** = 개발자(아빠) ↔ Claude Buddy(아이). 수염이 길어질수록 Buddy가 따가워한다.

## 톤 가이드

- **죄책감 금지.** "5시간 썼다" 면박 X. "수염이 길어졌네요" O.
- **위트 + 귀여움.** Claude Buddy는 화내지 않고 슬퍼하거나 살짝 삐친다.
- **과로 미화 금지.** 수염 길이는 자랑이 아니라 *신호*.
- 멘트는 한국어 자연체. 영문 ID(`smooth`/`stubble`/...)는 코드 키이므로 절대 한국어 변경에 같이 휩쓸리지 않게.

## 4대 설계 원칙

1. **로컬 우선** — 외부 네트워크 호출 0, 텔레메트리 0.
2. **본문 무시** — JSONL의 user/assistant 메시지 *본문*은 메모리에 올리지 않는다. `usage` 필드만 추출.
3. **비파괴** — Hook 등록 시 `~/.claude/settings.json` 기존 내용 보존, 백업 생성, uninstall로 완전 복구.
4. **단일 책임** — Parser는 토큰만, State는 단계 계산만, Renderer는 출력만.

## 절대 하지 말 것

- 네트워크 요청 (fetch, http, https, axios 등 import 금지)
- 텔레메트리·익명 통계 송신
- JSONL 본문 저장 또는 메모리 누적
- `~/.claude/settings.json` 다른 도구의 hook 덮어쓰기
- 사용자의 `state.json`을 마이그레이션 없이 비호환 변경

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
