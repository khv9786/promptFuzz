/**
 * status 첫 5회에만 보여주는 교육 멘트.
 * @param viewCount 이번 조회가 몇 번째인지 (1부터).
 * @returns 멘트 문자열, 또는 6번째+엔 null.
 */
export function educationHint(viewCount: number): string | null {
  switch (viewCount) {
    case 1:
      return '💡 PromptFuzz는 당신의 코딩 휴식을 위해 만들어졌어요.';
    case 2:
      return '💡 수염이 자라면 promptfuzz shave로 면도하세요.';
    case 3:
      return '💡 면도하면 스트레칭 카드 1장이 떠요. 30초만 해보세요.';
    case 4:
      return '💡 promptfuzz log로 30일 활동을 볼 수 있어요.';
    case 5:
      return '💡 promptfuzz config로 사용 패턴을 맞출 수 있어요.';
    default:
      return null;
  }
}
