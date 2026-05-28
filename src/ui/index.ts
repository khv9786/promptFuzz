// Ink 기반 UI 컴포넌트는 추후 통합 예정.
// 현재 v1 스켈레톤은 commands/status.ts와 commands/shave.ts에서
// chalk + console.log로 직접 출력하는 방식을 쓴다.
//
// 통합 시 컴포넌트 구조:
//   - <Status>      : 두 캐릭터 + 멘트 + 누적 토큰 카드
//   - <Beard>       : 단계별 ASCII 수염
//   - <Buddy>       : Claude Buddy 표정
//   - <Message>     : 단계별 멘트 (색상 포함)
//   - <ShaveGame>   : 방향키로 ▓를 밀어내는 미니게임 (useInput)
//   - <StretchCard> : 스트레칭 카드 카운트다운 (useEffect + setInterval)

export {};
