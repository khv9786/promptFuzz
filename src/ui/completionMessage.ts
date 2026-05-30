import type { BeardStage } from '../types/index.js';

/**
 * 면도 완료 멘트 결정.
 * 마일스톤(정확한 횟수)이 단계별 멘트보다 우선한다.
 *
 * @param shaveCount performShave 호출 *후*의 누적 면도 횟수 (shaveHistory.length)
 * @param stageBeforeShave 면도 직전 단계
 */
export function getCompletionMessage(shaveCount: number, stageBeforeShave: BeardStage): string {
  switch (shaveCount) {
    case 1:
      return '첫 면도네요! 시원해요.';
    case 10:
      return '🎉 10번째 면도. 베테랑이시군요.';
    case 50:
      return '🏆 50번째 면도. 진짜 헌신적이세요.';
    case 100:
      return '👑 100번째 면도. 전설입니다.';
    default:
      return stageCompletionMessage(stageBeforeShave);
  }
}

/**
 * 마일스톤(1/10/50/100)이면 축하 라벨, 아니면 null.
 * 면도 완료 화면의 축하 박스 표시 여부 판단용. (멘트와 별개의 시각 요소.)
 */
export function milestoneLabel(shaveCount: number): string | null {
  switch (shaveCount) {
    case 1:
      return '🎉 첫 면도!';
    case 10:
      return '🎉 10번째 면도!';
    case 50:
      return '🏆 50번째 면도!';
    case 100:
      return '👑 100번째 면도!';
    default:
      return null;
  }
}

/** 단계별 클로징 멘트 (마일스톤이 아닐 때 fallback). */
export function stageCompletionMessage(stageBeforeShave: BeardStage): string {
  switch (stageBeforeShave) {
    case 'stubble':
      return '벌써 정리하시네요. 부지런하세요.';
    case 'rugged':
      return '✨ 매끈! 한참 따가웠을 텐데, 수고하셨어요.';
    case 'hermit':
      return '✨ 매끈! 살아나셨네요. 정말 수고하셨어요.';
    default:
      // smooth/bushy 기본.
      return '✨ 매끈! 시원해졌어요.';
  }
}
