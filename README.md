# PromptFuzz 🧔

> 토큰을 수염으로, 휴식을 면도로 — Claude Code 사용 시간 관리 CLI 토이

Claude Code로 코딩하다 보면 시간 가는 줄 모르죠. PromptFuzz는 토큰 사용량을 추적해서 *당신의 가상 수염*이 자라게 만듭니다. 수염이 길어지면 Claude Buddy가 따가워하고, 면도(=휴식 + 스트레칭)하면 다시 매끈해집니다.

```
   .---.                     .---.
  ( o o )         ⚡        (>﹏<)
   \▒▒▒/                    \___/
    당신                   Claude
```

## 핵심 컨셉

- **수염** — Claude Code 토큰 누적량 (`~/.claude/projects/*.jsonl`을 파싱)
- **5단계** — 매끈 / 까칠 / 더부룩 / 산적 / 헤르미트
- **면도** — `promptfuzz shave` 명령으로 카운터 리셋 + 스트레칭 카드 1장

## 설치

```bash
npm install -g promptfuzz
promptfuzz install
```

`install` 명령은 `~/.claude/settings.json`에 Stop hook을 추가합니다 (기존 hook은 그대로 보존, 백업 파일도 생성).

## 사용법

```bash
promptfuzz status      # 현재 수염 상태 보기
promptfuzz shave       # 면도 + 스트레칭 카드
promptfuzz uninstall   # hook 제거
```

## 프라이버시

- **외부 통신 0** — 텔레메트리 없음, 분석 도구 없음
- **본문 무시** — JSONL의 프롬프트/응답 본문은 메모리에 올리지 않음. `usage` 필드만 읽음
- **로컬 저장** — `~/.promptfuzz/state.json` (권한 0600)

## 개발

```bash
git clone https://github.com/khv9786/promptFuzz.git
cd promptFuzz
npm install
npm run dev -- status   # 개발 모드 실행
npm test                # 테스트
npm run build           # 빌드
```

## 면책

PromptFuzz는 Anthropic과 무관한 비공식 도구입니다 (Unofficial third-party tool, not affiliated with Anthropic).

`Claude Buddy`는 위트를 위한 의인화된 마스코트이며, 그 반응은 실제 Claude의 상태·의견·감정이 아닙니다.

스트레칭 카드의 내용은 일반적인 정보일 뿐 의학적 조언이 아닙니다.

## 라이선스

MIT
