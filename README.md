# PromptFuzz 🧔

> 토큰을 수염으로, 휴식을 면도로 — Claude Code 사용 시간 관리 CLI 토이

Claude Code로 코딩하다 보면 시간 가는 줄 모르죠. PromptFuzz는 토큰 사용량을 추적해서 *당신의 가상 수염*이 자라게 만듭니다. 수염이 길어지면 Claude Buddy가 따가워하고, 면도(=휴식 + 스트레칭)하면 다시 매끈해집니다.

```
    .---.                     .---.
   ( o o )         ⚡        (>﹏<)
    \▓▓▓/                    \___/
     당신                   Claude
```

<!-- TODO: asciinema or animated GIF here -->

## 설치

```bash
npm install -g promptfuzz
promptfuzz install
```

`install` 명령은 `~/.claude/settings.json`에 Stop hook을 추가합니다. 기존 hook은 그대로 보존되고, 백업 파일(`settings.json.promptfuzz.bak`)도 자동 생성됩니다.

## 핵심 컨셉

- **수염** — Claude Code 토큰 누적량 (`~/.claude/projects/**/*.jsonl`의 `usage` 필드만 합산. 본문은 메모리에 안 올립니다.)
- **면도** — `promptfuzz shave` 명령으로 누적을 0으로 리셋 + 스트레칭 카드 1장.
- **캐릭터** — 개발자(아빠)와 Claude Buddy(아이). 수염이 길어질수록 Buddy가 따가워합니다.

## 수염 5단계

| 단계 | 한국어 이름 | 토큰 임계치 | Claude Buddy | 멘트 |
|---|---|---|---|---|
| ① | 매끈 | 0~10K | `(◕ᴗ◕)` | "오늘도 잘 부탁해요 아빠!" |
| ② | 까끌까끌 | 10~50K | `(•_• )` | "아빠 오늘 좀 까끌까끌해..." |
| ③ | 북슬북슬 | 50~200K | `(>﹏<)` | "아... 따가워요... 잠깐 쉬어가요?" |
| ④ | 따갑따갑 | 200~500K | `(╥﹏╥)` | "아빠 무서워요... 면도하고 와요..." |
| ⑤ | 고슴도치 | 500K+ | `(;﹏;)` | "이제 안아주기 힘들어요... 푹 쉬다 와요" |

단계가 올라가면 hook이 발동된 직후 짧은 알림 한 번. 매끈으로의 복귀(=면도 후)에는 알림이 뜨지 않습니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 수염이 자랐어요  ② 까끌까끌 → ③ 북슬북슬
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    (>﹏<)  "아... 따가워요... 잠깐 쉬어가요?"

💡 promptfuzz shave 로 면도 + 스트레칭
```

## 사용법

```bash
promptfuzz             # 환영 화면 + 사용 안내
promptfuzz status      # 오늘의 수염 보기
promptfuzz shave       # 면도 미니게임 → 스트레칭 카드
promptfuzz install     # Claude Code에 hook 등록
promptfuzz uninstall   # hook 제거 (~/.promptfuzz/는 유지)
promptfuzz --help      # 전체 명령 보기
```

### 면도 미니게임

`promptfuzz shave`는 3단계 의식입니다 — 마음 한 번 가다듬고, 살살 정리하고, 매끈하게 마무리.

```
🪒 면도 시작

    .---.
   (>﹏<)
    \▓▓▓/
     당신

"휴~ 자, 천천히 정리해볼까요"

준비되시면 아무 키나 누르세요.
```

`←` 또는 `→` 키를 6번 누르면 면도 완료. `q`로 언제든 중단(이 경우 토큰 카운터는 그대로). 비대화형 환경(Claude Code hook, CI)에서는 자동으로 면도가 완료되고 스트레칭 카드만 한 장 출력됩니다.

### 스트레칭 카드

면도 직후 작은 모달이 떠 카드 한 장을 권합니다.

```
╭──────────────────────────────────────╮
│  🧘 거북목 스트레칭 (30초)             │
│                                       │
│    1. 어깨를 천천히 뒤로 5번 돌리기    │
│    2. 턱을 가슴으로 천천히 당기기      │
│    3. 좌우로 천천히 고개 돌리기        │
│                                       │
│  ⏱  00:25  [██░░░░░░░░░░]              │
│                                       │
│  [Enter] 완료    [s] 다른 카드    [q] 닫기  │
╰──────────────────────────────────────╯
```

카운트다운은 표시만 합니다 — 0이 돼도 *자동으로 닫히지 않습니다*. 충분히 쉬셨을 때 `Enter`로 직접 마무리하세요. 강제 종료는 휴식의 본질을 해친다고 봤습니다.

## 첫 설치 후 — 온보딩 면도

이미 한참 Claude Code를 써온 분에게도 친절하게: 첫 `install` 직후 기존 JSONL 히스토리를 한 번 훑어 누적이 ② 임계치(10K)를 넘으면 짧은 충격 화면과 함께 선택지가 나타납니다.

```
당신의 Claude Code 토큰 히스토리를 발견했어요.

    (;﹏;)
    \███/

  "아빠... 13,326,206 토큰의 수염을 가지고 계셨네요..."

이제부터 새로 시작할까요?
  [Enter] 면도하고 시작 (권장)
  [s]     이대로 두고 시작 (현실 직시 모드)
```

10K 미만이면 충격 화면 없이 조용히 넘어갑니다. 비대화형 환경에서는 자동으로 면도(=새 출발)를 선택합니다.

## 프라이버시 / 신뢰

- **외부 통신 0** — 네트워크 호출, 텔레메트리, 분석 도구 일체 없음.
- **본문 무시** — JSONL의 user/assistant 메시지 본문은 *읽지 않습니다*. `usage` 필드만 스트리밍 파싱으로 추출.
- **로컬 저장** — `~/.promptfuzz/state.json` (권한 0600).
- **비파괴 hook 설치** — 기존 `~/.claude/settings.json` 보존 + 백업. `uninstall`로 완전 복구.
- **dogfooding 패치** — v0.1.0 직전 실환경 사용에서 StretchCard 진행률 바의 race condition을 발견해 즉시 핫픽스했습니다. 우리도 매일 씁니다.

## 의존성 정책 (요약)

`ink`/`react`는 **`shave` 명령에서만** dynamic import로 로드됩니다. `tick`/`status`/`install`/`uninstall`은 chalk만 사용해 부팅 시간 ~60ms를 유지합니다 (PRD 13.3의 100ms 목표 준수). 자세한 정책은 [CLAUDE.md](CLAUDE.md), 코드 구조는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 보세요.

## 개발

```bash
git clone https://github.com/khv9786/promptFuzz.git
cd promptFuzz
npm install
npm run dev -- status   # 빌드 없이 즉시 실행
npm test                # vitest run
npm run build           # tsup → dist/
```

기여 환영합니다 — `docs/PRD.md`에 설계 의도, `docs/ARCHITECTURE.md`에 폴더별 책임과 새 기능 추가 가이드가 있습니다.

## 면책

- PromptFuzz는 Anthropic과 무관한 **비공식** 도구입니다 (Unofficial third-party tool, not affiliated with Anthropic).
- **Claude Buddy**는 위트를 위한 의인화된 마스코트일 뿐, 실제 Claude의 상태·의견·감정과 무관합니다.
- 스트레칭 카드의 내용은 일반적인 정보일 뿐, **의학적 조언이 아닙니다**.

## 라이선스

MIT. [LICENSE](LICENSE) 참조.
