# PromptFuzz Demo Script (asciinema)

publish 직후 asciinema 녹화용 대본. 위트 흐름과 기술 준비를 분리해 적는다.

## 환경 준비

### 터미널 폰트 (중요)
한글 + 박스/블록 문자(`░ ▒ ▓ █ ╭ ╮`)가 깨지지 않는 폰트:
- **D2 Coding** (한국 개발자 기본, 권장)
- JetBrains Mono + Nerd Font
- Cascadia Code

일반 Windows 기본 폰트(Consolas 등)는 한글 정렬이 틀어질 수 있다.

### 터미널 사이즈
- `80x24` 또는 `100x30`
- 잔디(`promptfuzz log`)가 한 줄에 7칸 + 라벨이 들어가는 폭

### 색상 테마
- **어두운 배경 권장** — chalk의 green/yellow/red/redBright 대비가 살아남
- 라이트 테마는 dim(`·`)이 너무 흐릴 수 있음

### 초기 데이터 준비
임팩트에 따라 셋 중 선택:
1. **가장 임팩트**: 1억+ 토큰 ⑤ 고슴도치 (현실 헤비 유저 패턴)
2. **깔끔**: install 직후 ③ 북슬북슬 정도
3. **가벼움**: ② 까끌까끌 (Sonnet 일상)

> ⚠ 녹화 전 `~/.promptfuzz/state.json` 백업. 시연 중 면도하면 누적이 0이 된다.
> ```bash
> cp ~/.promptfuzz/state.json ~/.promptfuzz/state.json.demobak
> ```

## 시나리오 (총 약 1분)

### [0:00 – 0:08] 인트로 — 충격
```
$ promptfuzz status
```
→ ⑤ 고슴도치 화면. 2초 정지(충격 받은 호흡).

### [0:08 – 0:15] 면도 시작
```
$ promptfuzz shave
```
→ 진입 화면에서 3초 정지(마음 가다듬기) → 아무 키.

### [0:15 – 0:35] 면도 진행
→ `←` ×3, `→` ×3 을 0.5초 간격으로 자연스럽게.
→ 진행률 바 `[██████] 6/6` 채워지는 순간 강조.
→ 매끈 완료 화면 `✨ 매끈! 시원해졌어요.`

### [0:35 – 0:55] 스트레칭
→ 카드 자동 표시(예: 거북목).
→ 카운트다운 줄어드는 모습 ~10초.
→ `[Enter]` 완료.

### [0:55 – 1:00] 잔디 마무리
```
$ promptfuzz log
```
→ 잔디 그리드. 1초 정지로 인상 남기기.

### [선택, 1:00 – 1:10] 보너스
```
$ promptfuzz config
```
→ medium 프로필 + 임계치 표. "누구나 자기만의 수염을 가진다"는 인상.

## 녹화 명령

```bash
asciinema rec --title "PromptFuzz Demo" --idle-time-limit 2 promptfuzz-demo.cast
```

`--idle-time-limit 2`: 입력 사이 2초 이상 정지 자동 압축 → 흐름이 늘어지지 않는다.

## 후처리

### SVG 변환 (선택)
```bash
npm install -g svg-term-cli
svg-term --in promptfuzz-demo.cast --out docs/demo.svg --window
```

### asciinema 호스팅 후 README 임베드
1. https://asciinema.org 업로드 → `<ID>` 획득
2. README의 `<!-- TODO: demo -->` 자리에:
```markdown
[![asciicast](https://asciinema.org/a/<ID>.svg)](https://asciinema.org/a/<ID>)
```

## 주의사항

- 한 번에 완벽 X. 5~10회 시도 후 가장 자연스러운 테이크 선택.
- 키 입력 사이 너무 빠르면 시청자가 못 따라온다.
- 면도 미니게임에서 **`q` 금지** (시연 중단됨).
- 녹화 종료 후 백업 복원:
  ```bash
  mv ~/.promptfuzz/state.json.demobak ~/.promptfuzz/state.json
  ```

## 시연 후 자산 활용

- README placeholder에 임베드
- Twitter/X 스레드 첫 트윗
- HN "Show HN" 본문 링크
- Reddit r/ClaudeAI 본문 임베드
