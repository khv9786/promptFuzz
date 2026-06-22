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
    case 5:
      return '🎉 5번째 면도. 이제 베이진 않으시죠?';
    case 10:
      return '🎉 10번째 면도. 베테랑이시군요.';
    case 30:
      return '🎉 30번째 면도. 이젠 안하면 허전해요.';
    case 50:
      return '🏆 50번째 면도. 진짜 일을 얼마나 하시는 거예요.';
    case 100:
      return '👑 100번째 면도. 수고하셨어요. 부장님.';
    default:
      return stageCompletionMessage(stageBeforeShave);
  }
}

/**
 * 마일스톤(1/5/10/30/50/100)이면 축하 라벨, 아니면 null.
 * getCompletionMessage의 마일스톤 집합과 *반드시 동일*하게 유지할 것
 * (멘트는 축하인데 박스는 안 뜨는 불일치 방지). 멘트와 별개의 시각 요소.
 */
export function milestoneLabel(shaveCount: number): string | null {
  switch (shaveCount) {
    case 1:
      return '🎉 첫 면도!';
    case 5:
      return '🎉 5번째 면도!';
    case 10:
      return '🎉 10번째 면도!';
    case 30:
      return '🎉 30번째 면도!';
    case 50:
      return '🏆 50번째 면도!';
    case 100:
      return '👑 100번째 면도!';
    default:
      return null;
  }
}

/**
 * 면도 직후 Claude Buddy의 한마디 풀. completionMessage(면도 결과)와 별개로
 * "툭" 던지는 가벼운 케어 한 줄. 톤: 다정·존댓말·압박 없음 (CLAUDE.md 톤 가이드).
 * 연속기록/압박 멘트는 넣지 않는다 (죄책감 유발 금지).
 */
export const POST_SHAVE_ONELINERS: readonly string[] = [
  '오늘도 고생 많으셨어요.',
  '한결 가벼워졌죠? 물도 한 잔 어때요?',
  '수염 정리 완료. 어깨도 한 번 펴봐요.',
  '개운하죠? 잠깐 창밖도 보고요.',
  '깔끔해졌어요. 이 김에 좀 쉬어요.',
  '정리 끝! 기지개 한 번 켜고 가요.',
  '말끔하네요. 눈도 잠깐 감았다 떠봐요.',
  '한층 산뜻해졌어요. 숨 한 번 크게 쉬고요.',
];

/**
 * 한마디 하나를 고른다 (순수 함수 — rand 주입으로 테스트 가능).
 * @param rand 0~1 난수 (기본 Math.random)
 */
export function pickPostShaveOneLiner(rand: number = Math.random()): string {
  const i = Math.floor(rand * POST_SHAVE_ONELINERS.length);
  return POST_SHAVE_ONELINERS[Math.max(0, Math.min(POST_SHAVE_ONELINERS.length - 1, i))]!;
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
