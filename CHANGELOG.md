# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.19] - 2026-06-22

### Changed

- statusLine 등록에 `refreshInterval`(2초)을 추가 — 터미널 너비를 바꿔도 상태바가 곧 맞춰집니다 (statusLine은 리사이즈 이벤트로 재호출되지 않아, 주기적 새로고침으로 `COLUMNS` 갱신을 받음). 기존 사용자는 `promptfuzz statusline install`을 다시 실행하면 최신 설정으로 갱신됩니다.

## [0.1.18] - 2026-06-22

### Changed

- statusLine이 터미널 너비에 맞춰 적응합니다 (`COLUMNS` 활용). 좁은 터미널에서도 수염 단계와 면도 신호(🪒)가 잘리지 않습니다 — 도구 이름 → "shave" 텍스트 → 단계명 순으로 우아하게 줄입니다.

## [0.1.17] - 2026-06-22

### Changed

- `log`의 "최고 도달"이 같은 단계일 때 그날 토큰량이 가장 많았던 날을 가리키도록 개선 (동점 시 날짜가 안 바뀌던 문제 해소). 날짜 옆에 토큰량도 함께 표시.

## [0.1.16] - 2026-06-22

### Added

- 면도 완료 후 Claude Buddy의 한마디 추가 (작은 격려·케어 한 줄, 랜덤).
- `stats`에 이번 주를 돌아보는 한 줄 서사 추가 (dailyLog 재활용, 압박 없이).

## [0.1.14] - 2026-06-22

### Changed

- 내부: 버전을 `package.json` 단일 소스에서 읽도록 변경 (cli/info 하드코딩 제거, 유지보수성 개선). 사용자 동작 변화 없음.

## [0.1.13] - 2026-06-11

### Changed

- README 개편 — 소개·시선 설명을 더 친근한 톤으로 다듬고, 면도 미니게임 4방식(레이저/전기면도기/날 면도기/손으로 뽑기) 설명을 본문에 반영.
- 면도 완료 화면의 "면도 후" 수염에 반짝임(✨) 추가 — 매끈해진 기분을 강조.

## [0.1.12] - 2026-06-11

### Changed

- 면도 미니게임 보강 — 날 면도기를 상하좌우 4방향으로 확대. 날 면도기·손으로 뽑기에서 틀리거나(손은 1초 초과 포함) 하면 게이지가 한 칸 깎이고(빨갛게 표시) 새 방향으로 다시 시도합니다. (0.1.11은 기본 4방식까지만 게시됨 — 보강분이 0.1.12)

## [0.1.11] - 2026-06-10

### Added

- 면도 방식 4종 선택 — 레이저(5초 자동), 전기면도기(연타), 날 면도기(방향 맞추기), 손으로 뽑기(1초 타이밍). 방식마다 난이도가 다릅니다. 날 면도기·손으로 뽑기는 틀리면 따끔한 메시지와 함께 다시 시도합니다. (비대화형 환경은 기존처럼 방식 선택 없이 자동 면도)

## [0.1.10] - 2026-06-02

### Changed

- ⑤ 고슴도치 단계 Claude 표정의 세미콜론을 반각(`;`)으로 조정 — 눈매를 오밀조밀하게 (`( ;﹏;)`).
- Claude 얼굴 시선 공백을 넓혀 고개 방향(낮은 단계=당신 봄 / 높은 단계=외면)을 또렷하게 (글리프 폭에 따라 1~2칸).
- Claude 얼굴 줄을 머리/몸보다 1칸 왼쪽으로 미세 정렬 — 와이드 눈이 우측으로 번져 보이는 착시 보정.
- 면도 마일스톤 축하 박스의 가로줄(`-`) 길이를 내용 시각폭에 맞춰 조정 (내용이 박스를 삐져나오던 문제 해소).
- README 정리 — 오래된 데모 GIF 제거, `promptfuzz statusline`을 사용법 목록에 추가, macOS 지원 상태 표기(✅, 수동 검증·CI 미포함).

## [0.1.9] - 2026-06-02

### Fixed

- status 화면에서 상호작용 이모지(하트) 폭 때문에 Claude 머리/몸이 어긋나던 정렬 수정 — 하트를 얼굴 줄 *맨 끝*(Claude 뒤)으로 옮겨 Claude 앞을 순수 ASCII로 고정 (레거시 cmd 포함 모든 터미널 정렬).

### Changed

- statusLine에 PromptFuzz 이름 표시 (예: `PromptFuzz 🧔 \WWW/ ⑤ 고슴도치 · 3.2M · 🪒 shave`).

## [0.1.8] - 2026-06-02

### Changed

- Claude Buddy의 고개 방향 표현 추가 — 낮은 단계에선 당신을 바라보고, 따가워질수록 고개를 돌립니다 (괄호 내 정렬 활용). 면도하면 다시 바라봅니다.
- Claude Buddy 멘트를 존댓말로 통일 (캐릭터 일관성).
- ⑤ 고슴도치 단계 표정을 더 깊은 감정(흐느낌)으로 조정.

### Added

- 면도 마일스톤에 5회·30회 추가 (기존 1·10·50·100).

### Fixed

- package.json bin 필드 형식 정리 (publish 경고 제거).
- 문장부호·맞춤법 정리(.. → ..., 거에요 → 거예요 등), 시선 방향 주석 정정.

## [0.1.7] - 2026-06-01

### Changed

- 의미색 테마(`theme.ts`)를 모든 명령에 전면 적용 — `theme.success/info/warning/danger/critical/dim`로 색을 의미 단위로 통일 (기존 2/12 → 전 명령). `cli.ts` 환영 화면만 진입점 특수 케이스로 chalk 유지.
- ② 까끌까끌 단계 표정을 `( o_o )`로 통일 (표정 시퀀스 일관성: ^_^ → o_o → -_- → =_= → x_x).
- 빈 상태 안내 문구 톤 통일 (log/stats/면도 기록 — 따뜻한 안내 + 🌱).

### Fixed

- status 상호작용 영역의 단계별 1칸 정렬 흔들림 수정 — 시각 폭 인지 패딩으로 mid 영역을 고정폭화 (이모지 2칸 vs `~` 1칸 차이 해소). dev 블록도 시각폭 기준 정렬.
- stats "가장 자주 본 카드"의 괄호 중복 표기 수정 (`(30초) (2회)` → `(30초) · 2회`).
- install 안심(🔒) 메시지 색상 일관성 (theme 적용).
- info의 Locale 표시 폴백 (LANG 미설정 시 Intl 로케일 사용, unknown 방지).

### Added

- `info --json` 옵션 — 경로(사용자명/프로젝트명) 제외해 공유 안전.

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