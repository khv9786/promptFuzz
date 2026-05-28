/**
 * 스트레칭 카드의 카운트다운 진행률 바를 계산.
 *
 * 핫픽스 배경: 실환경 dogfooding에서 [s] 키로 짧은 카드로 교체할 때
 * React의 setState batch 안에 *이전 카드의 remaining*과 *새 카드의 total*이
 * 한 render에 함께 보일 수 있다 (remaining > total). 이때 `elapsed = total - remaining`
 * 이 음수가 되어 `'█'.repeat(filled)`가 RangeError를 발생시켰다.
 *
 * 모든 경계 케이스를 한 함수에 모아 단위 테스트로 회귀 가드.
 */

export interface ProgressBarInput {
  totalSeconds: number;
  remainingSeconds: number;
  barWidth: number;
}

export interface ProgressBarOutput {
  filled: number;
  empty: number;
  bar: string;
  /** remaining이 0 또는 음수면 true — 시간 만료. */
  isOverdue: boolean;
}

export function computeProgressBar(input: ProgressBarInput): ProgressBarOutput {
  const { totalSeconds, remainingSeconds, barWidth } = input;
  const safeWidth = Math.max(0, Math.floor(barWidth));
  const isOverdue = remainingSeconds <= 0;

  // barWidth가 0이면 빈 출력으로 정상 종료.
  if (safeWidth === 0) {
    return { filled: 0, empty: 0, bar: '', isOverdue };
  }

  // totalSeconds가 비정상이면 완전히 찬 바 반환 (사용자에게 "시간 종료"로 표시).
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return {
      filled: safeWidth,
      empty: 0,
      bar: '█'.repeat(safeWidth),
      isOverdue: true,
    };
  }

  // remaining을 [0, totalSeconds] 범위로 클램프. 음수와 초과 모두 차단.
  const clampedRemaining = Math.max(0, Math.min(totalSeconds, remainingSeconds));
  const elapsed = totalSeconds - clampedRemaining;
  const rawFilled = Math.round((elapsed / totalSeconds) * safeWidth);
  const filled = Math.max(0, Math.min(safeWidth, rawFilled));
  const empty = safeWidth - filled;

  return {
    filled,
    empty,
    bar: '█'.repeat(filled) + '░'.repeat(empty),
    isOverdue,
  };
}
