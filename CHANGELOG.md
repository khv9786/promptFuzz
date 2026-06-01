# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.6] - 2026-06-01

### Changed

- status에서 Claude Buddy가 수염 단계에 따라 점점 멀어지고 고개를 돌리는 연출 추가 (수염이 따가울수록 안기기 힘들어 거리를 둠, 시선 꼬리 `›`). 면도하면 다시 가까워집니다. ⑤ 기준 최대 폭 43칸으로 80칸 안전.
- ④ 따갑따갑 단계의 개발자 표정을 `( >_< )`(귀여움)에서 `( =_= )`(지친 얼굴)로 조정 — ③ `( -_- )`과 구분되며 점점 지쳐가는 흐름.

## [0.1.5] - 2026-06-01

### Added

- `promptfuzz statusline install` / `uninstall` / (인자 없이) 상태 표시 — Claude Code 상태바 설정을 자동화. 기존 statusLine이 있으면 확인 후 백업하고 적용(비파괴, `--yes`로 자동화).

### Fixed

- package.json `bin` 필드를 표준 형식(`./dist/cli.js`)으로 확인·정리 (publish 경고 방지).

## [0.1.4] - 2026-05-30

### Fixed

- 면도 진행 화면의 수염이 구버전 모양(긴 `W` 반복)으로 표시되던 버그 수정 — v0.1.3 비율 교정을 반영해 단계 수염이 진행률에 따라 깎이도록 변경.
- `settings.json` 쓰기를 원자적(temp→rename + fsync)으로 변경하여 쓰기 중단 시 손상 방지. `uninstall`에도 수정 전 백업 추가 (`reset`은 `uninstall` 경유로 적용).
- state 마이그레이션에 숫자/배열/단계 타입 가드 추가 — `cumulativeTokens`(null/문자열/음수→0), `shaveHistory`·`stretchCardsShown`(배열 아니면 [])·`lastJsonlOffset`(객체 아니면 {})·`currentStage`(유효 단계 아니면 smooth). 손상된 상태 파일로 인한 크래시 방지.

### Changed

- (문서) 프라이버시 섹션에 경로 노출 주의(`state.json`·`--info`) 추가, content-blind 설명을 "파싱 순간 메모리 경유"까지 정직하게 정밀화.

## [0.1.3] - 2026-05-30

### Changed

- 당신(개발자)의 수염 ASCII를 털 텍스처로 재설계 — 단계별 질감으로 ④/⑤ 구분을 명확히 (기존 블록 `▒▓█`은 변별이 약하고 폭도 모호). 순수 ASCII `\,,,/`·`\vvv/`·`\WWW/`·`\MWM/`, 턱 폭(`\___/`)에 맞춰 얼굴 밖으로 삐지지 않게 교정. 수염은 *당신*에게만 — Claude는 매끈한 턱 유지.
- 당신(개발자) 표정이 단계별로 변화 (`( ^_^ )` 여유 → `( -_- )` 나른 → `( x_x )` 코믹 지침) — 수염과 함께 과로 상태를 입체적으로 표현. 톤 가이드대로 죄책감 없이 코믹하게.
- 단계별 Claude 멘트를 2~3개 중 무작위 표시로 다양화 (기존 동결 멘트는 `messages[0]`로 보존).
- statusline에 단계별 *당신 수염*(ASCII)을 함께 표시 (예: `🧔 \WWWWW/ ④ 따갑따갑 · 3.2M · 🪒 shave`).

### Added

- 시간대별 인사 (아침/낮/저녁/새벽) — `new Date().getHours()`만 읽음 (content-blind).
- ASCII 로고 (README 상단 + `promptfuzz --info` 헤더).
- 면도 완료 시 before/after 시각 연출 (당신 수염이 사라짐, 아빠 얼굴 ASCII).
- 면도 마일스톤(1/10/50/100) 축하 박스 (왼쪽 레일, 폭 안전).

## [0.1.2] - 2026-05-30

### Fixed

- log 잔디 격자 정렬 깨짐 수정 — 요일 헤더(한글 2칸)와 데이터 셀(1칸)의 폭 불일치, 행 레이블('4w 전'/'이번주')의 시각 폭 제각각으로 세로 정렬이 어긋나던 문제. 격자 영역을 1칸 폭 ASCII(`M T W T F S S`, `4w`/`now`)로 통일 (string-width 의존성 없이 해결).
- 스트레칭 카드 정렬 깨짐 수정 — 이모지/한글 폭으로 오른쪽 테두리가 어긋나던 문제. 박스를 왼쪽 레일(│)만 남겨 폭 의존을 제거.
- 잔디 '없음' 셀을 `·`(U+00B7, East Asian Ambiguous 폭)에서 ASCII `.`(U+002E)로 변경 — 일부 CJK-우선 폰트에서 `·`가 2칸으로 그려져 미세하게 어긋날 여지를 제거, 격자 정렬을 100% 보장.

## [0.1.0] - 2026-05-30

### Added

- `status --line` — Claude Code 상태바(statusLine) 통합용 한 줄 출력 (토큰 0, 상시 표시). `tick` 미호출 순수 읽기.
- 인터랙티브 면도 미니게임 (Ink) — 진입 화면 → ←/→ 키 6회 → 매끈 완료의 3단계 의식. q 또는 Ctrl+C로 중단 가능. 비대화형 환경(CI / Claude Code hook)에서는 자동으로 면도 진행 후 종료.
- 스트레칭 카드 모달 (Ink) — 카운트다운 표시(자동 종료 X), Enter 완료 / s 다른 카드 / q 닫기.
- 단계 상승 알림에 구분선, 단계 번호(①~⑤), Buddy 표정과 인용 멘트, 권장 안내(③ 이상)를 더해 *사건감*을 살림.
- 인자 없이 `promptfuzz`를 실행하면 짧은 환영 메시지와 첫 사용 안내(`promptfuzz install`)를 출력.
- `promptfuzz install` 직후 기존 Claude Code 토큰 히스토리가 임계치(② 이상)를 넘으면 *온보딩 면도* 흐름 실행 — 면도하고 새 출발 / 이대로 유지 중 선택. 비대화형 환경에서는 자동으로 면도를 선택.
- 프로젝트 컨텍스트 문서: [`CLAUDE.md`](CLAUDE.md)(헌법), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)(코드 구조).
- 개발자용 슬래시 커맨드 `/test-full` — typecheck + build + test 일괄 실행.
- 임계치 프로필 3종 (light/medium/heavy) — 사용 패턴별 단계 임계치. `promptfuzz config`로 보기·변경.
- 일자별 활동 추적 (`dailyLog`) — 90일 보관, 토큰·단계·면도·스트레칭 카운트. `promptfuzz log`로 잔디 시각화 (`--days`, `--json` 옵션).
- 온보딩 면도 흐름에 프로필 선택 단계 추가 (비대화형은 자동 medium).
- 스트레칭 카드 11장으로 확장 (기존 5장 + 종아리/골반/발목/호흡/시선/흉곽).
- `promptfuzz reset` — 모든 데이터 + hook 완전 초기화. 대화형 y/N 확인, 비대화형은 기본 거부(`--yes`로 자동화). 경로 가드로 `~/.promptfuzz` 외 삭제 방지.
- `install` 직후 오프라인 안심 메시지 (외부 통신 0 명시).
- GitHub Issue 템플릿 3종 (bug report / feature request / config).
- `docs/DEMO_SCRIPT.md` — asciinema 녹화 시나리오 대본.
- 면도 미니게임이 시작 단계에 따라 난이도 변주 (bushy 6 / rugged 8 / hermit 10회) + 단계별 클로징 멘트.
- 면도 마일스톤 멘트 (1·10·50·100번째 기념).
- `status`에 최근 7일 미니 요약 (평균 단계 · 면도 횟수 · 추세).
- Buddy 표정 강화 (단계별 이모지 추가).
- 의미 기반 컬러 팔레트 (`src/ui/theme.ts`)로 색상 통일.
- `promptfuzz --info` (= `info`) — 진단용 환경/상태/hook/활동 요약.
- `promptfuzz stats` — 회고용 통계 (활성일·면도 간격·완료율·추세, `--days`/`--json`).
- `CONTRIBUTING.md` — 기여자 가이드.
- `extreme` 프로필 (Agent Teams 풀가동, 1M/5M/20M/50M 임계치).
- `status` 첫 5회 교육 멘트 (온보딩).
- `status`/`config`에 `--json` 출력.
- `PROMPTFUZZ_COMPACT=1` 환경변수로 단계 변화 알림 1줄 축약.
- 침묵 시간대 (`config --quiet-hours 23-07`) — 설정 범위엔 알림 침묵, 기록은 계속.
- E2E 통합 테스트 + 부팅 시간 회귀 벤치(`npm run perf`, 임계 100ms).
- `CODE_OF_CONDUCT.md`, PR 템플릿, dependabot 설정.
- JSONL 토큰 파서 — `~/.claude/projects/**/*.jsonl`의 `usage` 필드만 추출하며 프롬프트/응답 본문은 메모리에 올리지 않음 (content-blind).
- 수염 5단계와 프로필 기반(medium 기본: 50K / 300K / 1.5M / 5M) 상태 엔진.
- CLI 명령 10종: `install`, `uninstall`, `status`, `shave`, `tick`, `config`, `log`, `reset`, `info`, `stats` (+ 전역 `--info`).
- Claude Code Stop hook 비파괴 설치 — 기존 설정 보존, 백업 파일 생성, `uninstall`로 완전 복구 가능.
- 영속 상태 저장: `~/.promptfuzz/state.json` (권한 0600).
- 스트레칭 카드 5장 — 거북목 / 허리 / 손목 / 어깨 / 눈.
- GitHub Actions CI: Node 18 & 20 매트릭스에서 typecheck + build + test.

### Changed

- 5단계 한국어 이름을 의태어 중심으로 변경: 까칠 → **까끌까끌**, 더부룩 → **북슬북슬**, 산적 → **따갑따갑**, 헤르미트 → **고슴도치**. 영문 ID, 토큰 임계치, 단계별 멘트는 변경 없음.
- `shave` 명령이 Ink dynamic import로 미니게임 + 스트레칭 카드를 호출하도록 변경. ink/react는 `tsup` external + chunk splitting으로 분리 빌드돼, **tick/status/install/uninstall의 부팅 시간(~60ms)은 보존**.

### Fixed

- StretchCard: prevent crash from negative `String.repeat` count in progress bar (race condition between setCard/setRemaining on `[s]` swap; discovered via real-environment dogfooding). 진행률 바 계산을 순수 함수 `computeProgressBar`로 추출하고 모든 경계 케이스(remaining > total, 음수 remaining, total=0)를 클램프.
- 첫 푸시에서 `package-lock.json`이 누락돼 CI(`npm ci`)가 실패하던 문제를 lockfile 추가로 해결.
- `.gitattributes`로 줄끝을 LF로 명시 고정해, Windows 환경에서 매 커밋마다 발생하던 CRLF 경고를 해소.

[Unreleased]: https://github.com/khv9786/promptFuzz/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/khv9786/promptFuzz/releases/tag/v0.1.3
[0.1.2]: https://github.com/khv9786/promptFuzz/releases/tag/v0.1.2
[0.1.0]: https://github.com/khv9786/promptFuzz/releases/tag/v0.1.0