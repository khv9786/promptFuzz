# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-28

### Added

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
- JSONL 토큰 파서 — `~/.claude/projects/**/*.jsonl`의 `usage` 필드만 추출하며 프롬프트/응답 본문은 메모리에 올리지 않음 (content-blind).
- 수염 5단계와 프로필 기반(medium 기본: 50K / 300K / 1.5M / 5M) 상태 엔진.
- CLI 명령 7종: `install`, `uninstall`, `status`, `shave`, `tick`, `config`, `log`.
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

[Unreleased]: https://github.com/khv9786/promptFuzz/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/khv9786/promptFuzz/releases/tag/v0.1.0