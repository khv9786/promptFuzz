# PromptFuzz v0.1.0 Release Checklist

> publish 직전 한 번 훑는 점검표. 자동/수동 분리.

## 자동 검증

```powershell
npm run typecheck && npm run build && npm test
```

- [ ] typecheck 통과
- [ ] build 통과 (dist/cli.js + 3 chunks)
- [ ] test 전부 통과 (현재 155개)
- [ ] `npm run perf` 통과 (부팅 median ≤ 100ms)
- [ ] `node dist/cli.js --version` → `0.1.0`
- [ ] `node dist/cli.js` → 환영 메시지 정상
- [ ] `node dist/cli.js status` → 출력 정상

## 메타데이터

- [ ] `package.json` author: `khv9786 <hyunvin02@gmail.com>`
- [ ] `LICENSE` 존재 + `Copyright (c) 2026 khv9786`
- [ ] `repository` / `homepage` / `bugs` 필드 채워짐
- [ ] `files` 필드에 `dist`, `README.md`, `CHANGELOG.md`, `LICENSE` 포함
- [ ] `keywords` 5~10개

## 문서

- [ ] README.md 한 번 읽기 (오타, 일관성, ASCII 깨짐 여부)
- [ ] CHANGELOG.md `[Unreleased]` → `[0.1.0] - YYYY-MM-DD` 이동 (publish 직전)
- [ ] CLAUDE.md / docs/ARCHITECTURE.md / docs/PRD.md 변경 의도 없는지

## 실환경 검증 (핫픽스 후 추가)

- [ ] `promptfuzz shave` 실행 → 미니게임 통과
- [ ] 스트레칭 카드에서 `[s]` 키 5~10회 연타 → 크래시 X
- [ ] 카운트다운 만료(0초 도달) 후 `[s]` → 크래시 X
- [ ] 키 입력 echo 차단 (`q` 누를 때 q가 화면에 안 보임)

## npm publish 사전

- [ ] `npm whoami` → 로그인된 계정 확인
- [ ] 2FA 활성화 확인
- [ ] `npm publish --dry-run` → 의도된 파일만 포함 (src/, tests/, docs/, .claude/ 모두 제외 확인)
- [ ] `npm view promptfuzz` → 404 (이름 사용 가능)
- [ ] tarball 사이즈 합리적 (~14 kB / unpacked ~44 kB 근처)

## publish 실행

```powershell
npm publish
git tag v0.1.0
git push origin v0.1.0
```

- [ ] `npm publish` 성공
- [ ] npm 페이지 확인 (https://npmjs.com/package/promptfuzz)
- [ ] `git tag v0.1.0` 생성 + 푸시
- [ ] GitHub Release 작성 (CHANGELOG의 [0.1.0] 본문 사용)

## publish 후 검증

- [ ] 다른 환경(또는 임시 폴더)에서 `npm install -g promptfuzz`
- [ ] `promptfuzz --version` → `0.1.0`
- [ ] `promptfuzz install` → hook 등록 성공 + 백업 파일 생성 확인
- [ ] `promptfuzz status` → 정상 동작
- [ ] `promptfuzz uninstall` → hook 제거 + 백업 복구 확인

## 사후 holding

publish는 *돌이키기 어렵다*. 이상 발견 시:

- 72시간 내: `npm unpublish promptfuzz@0.1.0` 가능
- 그 이후: `npm deprecate promptfuzz@0.1.0 "이유"` 로 deprecate
- 핫픽스: `0.1.1`로 새 버전 publish 권장
